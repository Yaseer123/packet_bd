import { db } from "@/server/db";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    function isOrderTrackingBody(obj: unknown): obj is { invoice: string } {
      if (!obj || typeof obj !== "object") return false;
      const o = obj as Record<string, unknown>;
      return typeof o.invoice === "string";
    }
    if (!isOrderTrackingBody(body)) {
      return NextResponse.json(
        { error: "Invoice/order number is required." },
        { status: 400 },
      );
    }
    const invoice = body.invoice;

    const order = await db.order.findUnique({
      where: { id: invoice },
      include: {
        items: { include: { product: true } },
        address: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Return only safe fields
    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        productId: item.productId,
        productTitle: item.product?.title,
        quantity: item.quantity,
        price: item.price,
      })),
      address: order.address
        ? {
            street: order.address.street,
            city: order.address.city,
            state: order.address.state,
            zipCode: order.address.zipCode,
            phone: order.address.phone,
            email: order.address.email,
            name: order.address.name,
          }
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
