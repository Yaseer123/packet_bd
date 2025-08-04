"use client";
import { api } from "@/trpc/react";
import { pushPurchaseToDataLayer, type PurchaseData } from "@/utils/gtm";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");
  const [purchaseDataPushed, setPurchaseDataPushed] = useState(false);

  // Fetch order data if orderId is available (public query for both authenticated and guest users)
  const {
    data: orderData,
    isLoading,
    error,
  } = api.order.getOrderByIdPublic.useQuery(orderId!, {
    enabled: !!orderId,
    retry: false,
  });

  // Push purchase data to GTM when order data is available
  useEffect(() => {
    if (orderData && !purchaseDataPushed) {
      const purchaseData: PurchaseData = {
        orderId: orderData.id,
        total: orderData.total,
        products:
          orderData.items?.map((item) => ({
            id: item.productId,
            name: item.product?.title ?? "Unknown Product",
            price: item.price,
            quantity: item.quantity,
            productCode: item.product?.productCode ?? null,
            sku: item.sku ?? item.product?.sku ?? null,
            brand: item.product?.brand ?? "Brand",
            category: item.product?.category?.name ?? null,
          })) ?? [],
      };

      pushPurchaseToDataLayer(purchaseData);
      setPurchaseDataPushed(true);
    }
  }, [orderData, purchaseDataPushed]);

  // Handle error state
  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white">
        <h2 className="mb-4 text-2xl font-bold text-red-600">
          Order Not Found
        </h2>
        <p className="mb-2">Sorry, we couldn&apos;t find your order.</p>
        <p className="mb-4">Order ID: {orderId}</p>
        <button
          className="mt-4 rounded bg-black px-6 py-2 text-white hover:bg-black/75"
          onClick={() => router.push("/")}
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white">
      {/* Place FB Pixel or other tracking scripts here */}
      <h2 className="mb-4 text-2xl font-bold">Order Completed!</h2>
      <p className="mb-2">Thank you for your order.</p>
      <p className="mb-2">Your Invoice/Order Number:</p>
      <div className="mb-4 rounded bg-gray-100 px-4 py-2 font-mono text-lg">
        {isLoading ? "Loading..." : orderId}
      </div>
      <button
        className="mt-4 rounded bg-black px-6 py-2 text-white hover:bg-black/75"
        onClick={() => router.push("/my-account")}
      >
        Go to My Orders
      </button>
    </div>
  );
}
