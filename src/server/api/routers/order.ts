import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

// --- Branded Email Components ---
const emailHeader = `
  <div style="background: #fff; text-align: center; padding: 24px 0 8px 0;">
    <img src="https://packetbd.com/images/brand/RINORS.png" alt="Rinors" style="height: 48px;" />
  </div>
`;
const contactInfo = `
  <div style="text-align: center; font-size: 14px; color: #333; margin-bottom: 12px;">
    <strong>Contact:</strong> contact@packetbd.com | <strong>Phone:</strong> 01824443227<br/>
    <span>41/5 East Badda Dhaka, Bangladesh</span>
  </div>
`;
const socialLinks = `
  <div style="text-align: center; margin: 12px 0;">
    <a href="https://www.facebook.com/profile.php?id=61572946813700" style="margin: 0 6px; text-decoration: none;" target="_blank">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/facebook.svg" alt="Facebook" width="24" height="24" style="vertical-align:middle;"/>
    </a>
    <a href="https://www.instagram.com/rinors_electronic_store/" style="margin: 0 6px; text-decoration: none;" target="_blank">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg" alt="Instagram" width="24" height="24" style="vertical-align:middle;"/>
    </a>
    <a href="https://x.com/Rinors_Corpor" style="margin: 0 6px; text-decoration: none;" target="_blank">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/x.svg" alt="X (Twitter)" width="24" height="24" style="vertical-align:middle;"/>
    </a>
    <a href="https://www.tiktok.com/@rinors_ecommerce" style="margin: 0 6px; text-decoration: none;" target="_blank">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/tiktok.svg" alt="TikTok" width="24" height="24" style="vertical-align:middle;"/>
    </a>
    <a href="https://www.youtube.com/@rinorsecommerce" style="margin: 0 6px; text-decoration: none;" target="_blank">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/youtube.svg" alt="YouTube" width="24" height="24" style="vertical-align:middle;"/>
    </a>
  </div>
`;
const importantLinks = `
  <div style="text-align: center; margin-bottom: 16px; font-size: 14px;">
    <a href="https://packetbd.com/contact" style="margin: 0 10px; color: #007b55; text-decoration: none;">Contact Us</a> |
    <a href="https://packetbd.com/my-account" style="margin: 0 10px; color: #007b55; text-decoration: none;">My Account</a> |
    <a href="https://packetbd.com/order-tracking" style="margin: 0 10px; color: #007b55; text-decoration: none;">Order Tracking</a> |
    <a href="https://packetbd.com/faqs" style="margin: 0 10px; color: #007b55; text-decoration: none;">FAQs</a> |
    <a href="https://packetbd.com/privacy-policy" style="margin: 0 10px; color: #007b55; text-decoration: none;">Privacy Policy</a>
  </div>
`;
const emailFooter = `
  <div style="background: #f7f7f7; color: #888; text-align: center; padding: 12px 0; font-size: 13px;">
    &copy; 2024 Packet BD. All Rights Reserved.
  </div>
`;
// --- END Branded Email Components ---

export const orderRouter = createTRPCRouter({
  getOrders: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.order.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            price: true,
            color: true,
            size: true,
            sku: true,
            deliveryMethod: true,
            product: true,
          },
        },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getOrderbyStatus: protectedProcedure
    .input(
      z
        .enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.order.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input && { status: input }),
        },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              price: true,
              color: true,
              size: true,
              sku: true,
              deliveryMethod: true,
              product: true,
            },
          },
          address: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getLatestOrder: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.order.findFirst({
      where: { userId: ctx.session.user.id },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            price: true,
            color: true,
            size: true,
            sku: true,
            deliveryMethod: true,
            product: true,
          },
        },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getOrderById: protectedProcedure
    .input(z.string()) // Order ID
    .query(async ({ ctx, input }) => {
      return await ctx.db.order.findUnique({
        where: { id: input },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              price: true,
              color: true,
              size: true,
              sku: true,
              deliveryMethod: true,
              product: true,
            },
          },
          address: true,
        },
      });
    }),

  placeOrder: protectedProcedure
    .input(
      z.object({
        cartItems: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().min(1),
            color: z.string().optional(),
            size: z.string().optional(),
            sku: z.string().optional(),
            colorName: z.string().optional(),
            deliveryMethod: z.string().optional(),
          }),
        ),
        addressId: z.string().optional(),
        notes: z.string().optional(),
        shippingCost: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const user = await ctx.db.user.findUnique({ where: { id: userId } });

      // Get products for all cart items
      const products = await ctx.db.product.findMany({
        where: {
          id: {
            in: input.cartItems.map((item) => item.productId),
          },
        },
      });

      // Check stock availability
      for (const cartItem of input.cartItems) {
        const product = products.find((p) => p.id === cartItem.productId);
        if (!product) {
          throw new Error(`Product not found: ${cartItem.productId}`);
        }
        if (product.stock < cartItem.quantity) {
          throw new Error(`Insufficient stock for product: ${product.title}`);
        }
      }

      // Create a map of product prices
      const productPriceMap = new Map(
        products.map((product) => [product.id, product.discountedPrice]),
      );

      // Calculate product total
      const productTotal = input.cartItems.reduce(
        (acc, item) =>
          acc + item.quantity * (productPriceMap.get(item.productId) ?? 0),
        0,
      );
      // const shippingCost = input.shippingCost ?? 0;
      // const total = productTotal + shippingCost;
      const shippingCost = 0; // Shipping is free for now
      const total = productTotal; // No shipping cost added

      // Start transaction (DB only)
      const order = await ctx.db.$transaction(async (tx) => {
        // Update product stock
        for (const cartItem of input.cartItems) {
          await tx.product.update({
            where: { id: cartItem.productId },
            data: {
              stock: {
                decrement: cartItem.quantity,
              },
            },
          });
        }

        // Create order
        const orderData = {
          userId,
          total,
          shippingCost,
          addressId: input.addressId,
          notes: input.notes,
          items: {
            create: input.cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: productPriceMap.get(item.productId) ?? 0,
              color: item.color,
              size: item.size,
              sku: item.sku,
              colorName: item.colorName,
              deliveryMethod: item.deliveryMethod,
            })),
          },
        };

        return await tx.order.create({ data: orderData });
      });

      // Fetch the full order with relations to return to the frontend
      const createdOrder = await ctx.db.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              price: true,
              color: true,
              size: true,
              sku: true,
              deliveryMethod: true,
              product: true,
            },
          },
          address: true,
        },
      });

      // Debug log for order and items
      console.log("Order for email:", JSON.stringify(createdOrder, null, 2));

      // Fetch address details if available
      let address = null;
      if (order.addressId) {
        address = await ctx.db.address.findUnique({
          where: { id: order.addressId },
        });
      }

      // Build product details table
      let productRows = "";
      if (
        createdOrder &&
        Array.isArray(createdOrder.items) &&
        createdOrder.items.length > 0
      ) {
        for (const item of createdOrder.items) {
          // Log delivery method for debugging
          console.log("EMAIL: OrderItem deliveryMethod:", item.deliveryMethod);
          let productTitle = item.product?.title;
          if (!productTitle && item.productId) {
            const prod = await ctx.db.product.findUnique({
              where: { id: item.productId },
            });
            productTitle = prod?.title ?? "Unknown Product";
          }
          const color = item.color
            ? `<br/><span style='color:#555;'>Color: ${item.color}</span>`
            : "";
          const size = item.size
            ? `<br/><span style='color:#555;'>Size: ${item.size}</span>`
            : "";
          const sku = item.sku
            ? `<br/><span style='color:#555;'>SKU: ${item.sku}</span>`
            : "";
          const delivery = item.deliveryMethod
            ? `<br/><span style='color:#555;'>Delivery: ${item.deliveryMethod}</span>`
            : "";
          productRows += `
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">
                ${productTitle}${color}${size}${sku}${delivery}
              </td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">৳${item.price}</td>
            </tr>
          `;
        }
      }
      const productsTable = productRows
        ? `<div style="margin-bottom: 24px;">
                <strong>Products:</strong>
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 15px;">
                  <thead>
                    <tr style="background: #f7f7f7;">
                      <th style="text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd;">Product</th>
                      <th style="text-align: center; padding: 8px 12px; border-bottom: 2px solid #ddd;">Qty</th>
                      <th style="text-align: right; padding: 8px 12px; border-bottom: 2px solid #ddd;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productRows}
                  </tbody>
                </table>
              </div>`
        : "";
      const addressBlock = address
        ? `<div style="margin-bottom: 16px;">
                <strong>Shipping Address:</strong><br/>
                ${address.street}<br/>
                ${address.city}, ${address.state} ${address.zipCode}<br/>
                <strong>Mobile:</strong> ${address.phone}<br/>
                <strong>Email:</strong> ${address.email}
             </div>`
        : '<div style="margin-bottom: 16px;"><em>No address provided.</em></div>';
      const notesBlock = input.notes
        ? `<div style="margin-bottom: 16px;"><strong>Additional Notes:</strong><br/>${input.notes}</div>`
        : "";

      // --- Professional Email Wrapper ---
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          ${emailHeader}
          <div style="padding: 24px 32px;">
            <h2 style="margin: 0; color: #007b55;">New Order Placed</h2>
            <p style="font-size: 16px;">A new order has been placed on Rinors Ecommerce Admin.</p>
            <div style="margin-bottom: 16px;"><strong>Order ID:</strong> ${order.id}</div>
            <div style="margin-bottom: 8px;"><strong>Subtotal:</strong> ৳${productTotal}</div>
            <div style="margin-bottom: 8px;"><strong>Shipping:</strong> ৳${shippingCost}</div>
            <div style="margin-bottom: 16px;"><strong>Total:</strong> ৳${order.total}</div>
            ${productsTable}
            ${addressBlock}
            ${notesBlock}
            <p style="margin-top: 32px; color: #888; font-size: 13px;">Please process this order promptly.</p>
          </div>
          ${contactInfo}
          ${socialLinks}
          ${importantLinks}
          ${emailFooter}
        </div>
      `;
      // Send admin email (outside transaction)
      console.log("EMAIL HTML:", html);
      await resend.emails.send({
        from: "no-reply@packetbd.com",
        to: "contact@packetbd.com",
        subject: "New Order Placed",
        html,
      });

      // Send confirmation email to customer (outside transaction)
      try {
        if (user?.email) {
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
              ${emailHeader}
              <div style="padding: 24px 32px;">
                <h2 style="margin: 0; color: #222;">Order Confirmed!</h2>
                <p>Hi${user.name ? ` ${user.name}` : ""},</p>
                <p>Thank you for your order. Your order has been <b>confirmed</b> and is being processed.</p>
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Subtotal:</strong> ৳${productTotal}</p>
                <!-- <p><strong>Shipping:</strong> ৳${shippingCost}</p> -->
                <p><strong>Total:</strong> ৳${order.total}</p>
                ${productsTable}
                ${addressBlock}
                <!-- ${notesBlock} -->
                <p style="margin-top: 32px; color: #888; font-size: 13px;">If you have any questions, reply to this email.</p>
              </div>
              ${contactInfo}
              ${socialLinks}
              ${importantLinks}
              ${emailFooter}
            </div>
          `;
          console.log("EMAIL HTML:", html);
          await resend.emails.send({
            from: "no-reply@packetbd.com",
            to: user.email,
            subject: "Your order is confirmed!",
            html,
          });
        }
      } catch (e) {
        console.error("Failed to send order confirmation email to customer", e);
      }

      return createdOrder;
    }),

  updateOrderStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum([
          "PENDING",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updatedOrder = await ctx.db.order.update({
        where: { id: input.orderId },
        data: { status: input.status },
        include: { user: true },
      });

      // Only send email for SHIPPED or CANCELLED
      if (input.status === "SHIPPED" || input.status === "CANCELLED") {
        try {
          const user = updatedOrder.user;
          if (user?.email) {
            // Fetch order items and address for product table
            const orderWithDetails = await ctx.db.order.findUnique({
              where: { id: updatedOrder.id },
              include: {
                items: {
                  select: {
                    id: true,
                    productId: true,
                    quantity: true,
                    price: true,
                    color: true,
                    size: true,
                    sku: true,
                    deliveryMethod: true,
                    product: true,
                  },
                },
                address: true,
              },
            });
            // Build product details table
            let productRows = "";
            if (
              orderWithDetails &&
              Array.isArray(orderWithDetails.items) &&
              orderWithDetails.items.length > 0
            ) {
              for (const item of orderWithDetails.items) {
                // Log delivery method for debugging
                console.log(
                  "EMAIL: OrderItem deliveryMethod:",
                  item.deliveryMethod,
                );
                let productTitle = item.product?.title;
                if (!productTitle && item.productId) {
                  const prod = await ctx.db.product.findUnique({
                    where: { id: item.productId },
                  });
                  productTitle = prod?.title ?? "Unknown Product";
                }
                const color = item.color
                  ? `<br/><span style='color:#555;'>Color: ${item.color}</span>`
                  : "";
                const size = item.size
                  ? `<br/><span style='color:#555;'>Size: ${item.size}</span>`
                  : "";
                const sku = item.sku
                  ? `<br/><span style='color:#555;'>SKU: ${item.sku}</span>`
                  : "";
                const delivery = item.deliveryMethod
                  ? `<br/><span style='color:#555;'>Delivery: ${item.deliveryMethod}</span>`
                  : "";
                productRows += `
                  <tr>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">
                      ${productTitle}${color}${size}${sku}${delivery}
                    </td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">৳${item.price}</td>
                  </tr>
                `;
              }
            }
            const productsTable = productRows
              ? `<div style="margin-bottom: 24px;">
                      <strong>Products:</strong>
                      <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 15px;">
                        <thead>
                          <tr style="background: #f7f7f7;">
                            <th style="text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd;">Product</th>
                            <th style="text-align: center; padding: 8px 12px; border-bottom: 2px solid #ddd;">Qty</th>
                            <th style="text-align: right; padding: 8px 12px; border-bottom: 2px solid #ddd;">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${productRows}
                        </tbody>
                      </table>
                    </div>`
              : "";
            const addressBlock = orderWithDetails?.address
              ? `<div style="margin-bottom: 16px;">
                      <strong>Shipping Address:</strong><br/>
                      ${orderWithDetails.address.street}<br/>
                      ${orderWithDetails.address.city}, ${orderWithDetails.address.state} ${orderWithDetails.address.zipCode}<br/>
                      <strong>Mobile:</strong> ${orderWithDetails.address.phone}<br/>
                      <strong>Email:</strong> ${orderWithDetails.address.email}
                   </div>`
              : '<div style="margin-bottom: 16px;"><em>No address provided.</em></div>';
            const notesBlock = orderWithDetails?.notes
              ? `<div style="margin-bottom: 16px;"><strong>Additional Notes:</strong><br/>${orderWithDetails.notes}</div>`
              : "";
            let subject = "";
            let html = "";
            if (input.status === "SHIPPED") {
              subject = "Your order has been shipped!";
              html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                  ${emailHeader}
                  <div style="padding: 24px 32px;">
                    <h2 style="margin: 0; color: #007b55;">Order Shipped!</h2>
                    <p>Hi${user.name ? ` ${user.name}` : ""},</p>
                    <p>Your order <b>${updatedOrder.id}</b> has been <b>shipped</b> and is on its way!</p>
                    <p><strong>Order ID:</strong> ${updatedOrder.id}</p>
                    <p><strong>Total:</strong> ৳${updatedOrder.total}</p>
                    ${productsTable}
                    ${addressBlock}
                    ${notesBlock}
                    <p style="margin-top: 32px; color: #888; font-size: 13px;">Thank you for shopping with us!</p>
                  </div>
                  ${contactInfo}
                  ${socialLinks}
                  ${importantLinks}
                  ${emailFooter}
                </div>
              `;
            } else if (input.status === "CANCELLED") {
              subject = "Your order has been cancelled";
              html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                  ${emailHeader}
                  <div style="padding: 24px 32px;">
                    <h2 style="margin: 0; color: #d32f2f;">Order Cancelled</h2>
                    <p>Hi${user.name ? ` ${user.name}` : ""},</p>
                    <p>Your order <b>${updatedOrder.id}</b> has been <b>cancelled</b>.</p>
                    <p><strong>Order ID:</strong> ${updatedOrder.id}</p>
                    <p><strong>Total:</strong> ৳${updatedOrder.total}</p>
                    ${productsTable}
                    ${addressBlock}
                    ${notesBlock}
                    <p style="margin-top: 32px; color: #888; font-size: 13px;">If you have any questions, reply to this email.</p>
                  </div>
                  ${contactInfo}
                  ${socialLinks}
                  ${importantLinks}
                  ${emailFooter}
                </div>
              `;
            }
            await resend.emails.send({
              from: "no-reply@packetbd.com",
              to: user.email,
              subject,
              html,
            });
          }
        } catch (e) {
          console.error("Failed to send order status update email", e);
        }
      }

      return updatedOrder;
    }),

  getAllOrders: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            price: true,
            color: true,
            size: true,
            sku: true,
            deliveryMethod: true,
            product: true,
          },
        },
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  placeGuestOrder: publicProcedure
    .input(
      z.object({
        cartItems: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number().min(1),
            color: z.string().optional(),
            size: z.string().optional(),
            sku: z.string().optional(),
            colorName: z.string().optional(),
            deliveryMethod: z.string().optional(),
          }),
        ),
        addressId: z.string().optional(),
        notes: z.string().optional(),
        shippingCost: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get products for all cart items
      const products = await ctx.db.product.findMany({
        where: {
          id: {
            in: input.cartItems.map((item) => item.productId),
          },
        },
      });

      // Check stock availability
      for (const cartItem of input.cartItems) {
        const product = products.find((p) => p.id === cartItem.productId);
        if (!product) {
          throw new Error(`Product not found: ${cartItem.productId}`);
        }
        if (product.stock < cartItem.quantity) {
          throw new Error(`Insufficient stock for product: ${product.title}`);
        }
      }

      // Create a map of product prices
      const productPriceMap = new Map(
        products.map((product) => [product.id, product.discountedPrice]),
      );

      // Calculate product total
      const productTotal = input.cartItems.reduce(
        (acc, item) =>
          acc + item.quantity * (productPriceMap.get(item.productId) ?? 0),
        0,
      );
      // const shippingCost = input.shippingCost ?? 0;
      // const total = productTotal + shippingCost;
      const shippingCost = 0; // Shipping is free for now
      const total = productTotal; // No shipping cost added

      // Start transaction (DB only)
      const order = await ctx.db.$transaction(async (tx) => {
        for (const cartItem of input.cartItems) {
          await tx.product.update({
            where: { id: cartItem.productId },
            data: { stock: { decrement: cartItem.quantity } },
          });
        }
        return await tx.order.create({
          data: {
            userId: null,
            total,
            shippingCost,
            ...(input.addressId ? { addressId: input.addressId } : {}),
            notes: input.notes,
            items: {
              create: input.cartItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: productPriceMap.get(item.productId) ?? 0,
                color: item.color,
                size: item.size,
                sku: item.sku,
                colorName: item.colorName,
                deliveryMethod: item.deliveryMethod,
              })),
            },
          },
        });
      });

      // After transaction, fetch order with items/products, address, and user
      const fullOrder = await ctx.db.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              price: true,
              color: true,
              size: true,
              sku: true,
              deliveryMethod: true,
              product: true,
            },
          },
        },
      });
      // Debug log for guest order and items
      console.log("Guest order for email:", JSON.stringify(fullOrder, null, 2));
      let address = null;
      if (order.addressId) {
        address = await ctx.db.address.findUnique({
          where: { id: order.addressId },
        });
      }

      // Build product details table for guest order
      let guestProductRows = "";
      if (
        fullOrder &&
        Array.isArray(fullOrder.items) &&
        fullOrder.items.length > 0
      ) {
        for (const item of fullOrder.items) {
          // Log delivery method for debugging
          console.log("EMAIL: OrderItem deliveryMethod:", item.deliveryMethod);
          let productTitle = item.product?.title;
          if (!productTitle && item.productId) {
            const prod = await ctx.db.product.findUnique({
              where: { id: item.productId },
            });
            productTitle = prod?.title ?? "Unknown Product";
          }
          const color = item.color
            ? `<br/><span style='color:#555;'>Color: ${item.color}</span>`
            : "";
          const size = item.size
            ? `<br/><span style='color:#555;'>Size: ${item.size}</span>`
            : "";
          const sku = item.sku
            ? `<br/><span style='color:#555;'>SKU: ${item.sku}</span>`
            : "";
          const delivery = item.deliveryMethod
            ? `<br/><span style='color:#555;'>Delivery: ${item.deliveryMethod}</span>`
            : "";
          guestProductRows += `
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">
                ${productTitle}${color}${size}${sku}${delivery}
              </td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">৳${item.price}</td>
            </tr>
          `;
        }
      }
      const guestProductsTable = guestProductRows
        ? `<div style="margin-bottom: 24px;">
              <strong>Products:</strong>
              <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 15px;">
                <thead>
                  <tr style="background: #f7f7f7;">
                    <th style="text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd;">Product</th>
                    <th style="text-align: center; padding: 8px 12px; border-bottom: 2px solid #ddd;">Qty</th>
                    <th style="text-align: right; padding: 8px 12px; border-bottom: 2px solid #ddd;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${guestProductRows}
                </tbody>
              </table>
            </div>`
        : "";
      const addressBlock = address
        ? `<div style="margin-bottom: 16px;">
              <strong>Shipping Address:</strong><br/>
              ${address.street}<br/>
              ${address.city}, ${address.state} ${address.zipCode}<br/>
              <strong>Mobile:</strong> ${address.phone}<br/>
              <strong>Email:</strong> ${address.email}
           </div>`
        : '<div style="margin-bottom: 16px;"><em>No address provided.</em></div>';
      const notesBlock = input.notes
        ? `<div style="margin-bottom: 16px;"><strong>Additional Notes:</strong><br/>${input.notes}</div>`
        : "";

      // Send emails (outside transaction)
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          ${emailHeader}
          <div style="padding: 24px 32px;">
            <h2 style="margin: 0; color: #007b55;">New Guest Order Placed</h2>
            <p style="font-size: 16px;">A new guest order has been placed on Rinors Ecommerce Admin.</p>
            <div style="margin-bottom: 16px;"><strong>Order ID:</strong> ${order.id}</div>
            <div style="margin-bottom: 8px;"><strong>Subtotal:</strong> ৳${productTotal}</div>
            <!-- <div style="margin-bottom: 8px;"><strong>Shipping:</strong> ৳${shippingCost}</div> -->
            <div style="margin-bottom: 16px;"><strong>Total:</strong> ৳${order.total}</div>
            ${guestProductsTable}
            ${addressBlock}
            <!-- ${notesBlock} -->
            <p style="margin-top: 32px; color: #888; font-size: 13px;">Please process this order promptly.</p>
          </div>
          ${contactInfo}
          ${socialLinks}
          ${importantLinks}
          ${emailFooter}
        </div>
      `;
      console.log("EMAIL HTML:", html);
      await resend.emails.send({
        from: "no-reply@packetbd.com",
        to: "contact@packetbd.com",
        subject: "New Guest Order Placed",
        html,
      });

      if (address?.email) {
        const guestHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            ${emailHeader}
            <div style="padding: 24px 32px;">
              <h2 style="margin: 0; color: #222;">Order Confirmed!</h2>
              <p>Hi${address.name ? ` ${address.name}` : ""},</p>
              <p>Thank you for your order. Your order has been <b>confirmed</b> and is being processed.</p>
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Subtotal:</strong> ৳${productTotal}</p>
              <!-- <p><strong>Shipping:</strong> ৳${shippingCost}</p> -->
              <p><strong>Total:</strong> ৳${order.total}</p>
              ${guestProductsTable}
              ${addressBlock}
              <!-- ${notesBlock} -->
              <p style="margin-top: 32px; color: #888; font-size: 13px;">If you have any questions, reply to this email.</p>
            </div>
            ${contactInfo}
            ${socialLinks}
            ${importantLinks}
            ${emailFooter}
          </div>
        `;
        console.log("EMAIL HTML:", guestHtml);
        await resend.emails.send({
          from: "no-reply@packetbd.com",
          to: address.email,
          subject: "Your order is confirmed!",
          html: guestHtml,
        });
      }

      // Link order to user if a user exists with the same email as the address
      if (address?.email) {
        const user = await ctx.db.user.findUnique({
          where: { email: address.email },
        });
        if (user) {
          await ctx.db.order.update({
            where: { id: order.id },
            data: { userId: user.id },
          });
        }
      }
      return order;
    }),

  // Cancel an order
  cancelOrder: protectedProcedure
    .input(z.string()) // Order ID
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findFirst({
        where: {
          id: input,
          userId: ctx.session.user.id,
          status: {
            notIn: ["DELIVERED", "CANCELLED"],
          },
        },
      });

      if (!order) {
        throw new Error("Order not found or cannot be cancelled");
      }

      const updatedOrder = await ctx.db.order.update({
        where: { id: input },
        data: { status: "CANCELLED" },
        include: { user: true },
      });

      // Send cancellation email
      try {
        const user = updatedOrder.user;
        if (user?.email) {
          // Fetch order items and address for product table
          const orderWithDetails = await ctx.db.order.findUnique({
            where: { id: updatedOrder.id },
            include: {
              items: {
                select: {
                  id: true,
                  productId: true,
                  quantity: true,
                  price: true,
                  color: true,
                  size: true,
                  sku: true,
                  deliveryMethod: true,
                  product: true,
                },
              },
              address: true,
            },
          });
          // Build product details table
          let productRows = "";
          if (
            orderWithDetails &&
            Array.isArray(orderWithDetails.items) &&
            orderWithDetails.items.length > 0
          ) {
            for (const item of orderWithDetails.items) {
              // Log delivery method for debugging
              console.log(
                "EMAIL: OrderItem deliveryMethod:",
                item.deliveryMethod,
              );
              let productTitle = item.product?.title;
              if (!productTitle && item.productId) {
                const prod = await ctx.db.product.findUnique({
                  where: { id: item.productId },
                });
                productTitle = prod?.title ?? "Unknown Product";
              }
              const color = item.color
                ? `<br/><span style='color:#555;'>Color: ${item.color}</span>`
                : "";
              const size = item.size
                ? `<br/><span style='color:#555;'>Size: ${item.size}</span>`
                : "";
              const sku = item.sku
                ? `<br/><span style='color:#555;'>SKU: ${item.sku}</span>`
                : "";
              const delivery = item.deliveryMethod
                ? `<br/><span style='color:#555;'>Delivery: ${item.deliveryMethod}</span>`
                : "";
              productRows += `
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">
                    ${productTitle}${color}${size}${sku}${delivery}
                  </td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">৳${item.price}</td>
                </tr>
              `;
            }
          }
          const productsTable = productRows
            ? `<div style="margin-bottom: 24px;">
                    <strong>Products:</strong>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 15px;">
                      <thead>
                        <tr style="background: #f7f7f7;">
                          <th style="text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd;">Product</th>
                          <th style="text-align: center; padding: 8px 12px; border-bottom: 2px solid #ddd;">Qty</th>
                          <th style="text-align: right; padding: 8px 12px; border-bottom: 2px solid #ddd;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${productRows}
                      </tbody>
                    </table>
                  </div>`
            : "";
          const addressBlock = orderWithDetails?.address
            ? `<div style="margin-bottom: 16px;">
                    <strong>Shipping Address:</strong><br/>
                    ${orderWithDetails.address.street}<br/>
                    ${orderWithDetails.address.city}, ${orderWithDetails.address.state} ${orderWithDetails.address.zipCode}<br/>
                    <strong>Mobile:</strong> ${orderWithDetails.address.phone}<br/>
                    <strong>Email:</strong> ${orderWithDetails.address.email}
                 </div>`
            : '<div style="margin-bottom: 16px;"><em>No address provided.</em></div>';
          const notesBlock = orderWithDetails?.notes
            ? `<div style="margin-bottom: 16px;"><strong>Additional Notes:</strong><br/>${orderWithDetails.notes}</div>`
            : "";
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
              ${emailHeader}
              <div style="padding: 24px 32px;">
                <h2 style="margin: 0; color: #d32f2f;">Order Cancelled</h2>
                <p>Hi${user.name ? ` ${user.name}` : ""},</p>
                <p>Your order <b>${updatedOrder.id}</b> has been <b>cancelled</b>.</p>
                <p><strong>Order ID:</strong> ${updatedOrder.id}</p>
                <p><strong>Total:</strong> ৳${updatedOrder.total}</p>
                ${productsTable}
                ${addressBlock}
                ${notesBlock}
                <p style="margin-top: 32px; color: #888; font-size: 13px;">If you have any questions, reply to this email.</p>
              </div>
              ${contactInfo}
              ${socialLinks}
              ${importantLinks}
              ${emailFooter}
            </div>
          `;
          await resend.emails.send({
            from: "no-reply@packetbd.com",
            to: user.email,
            subject: "Your order has been cancelled",
            html,
          });
        }
      } catch (e) {
        console.error("Failed to send order cancellation email", e);
      }

      return updatedOrder;
    }),
});
