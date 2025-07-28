"use client";
import { trackPurchase } from "@/components/MetaPixelProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");

  useEffect(() => {
    // Track purchase event when order is confirmed
    if (orderId) {
      // For now, we'll track a basic purchase event
      // In a real implementation, you'd fetch order details from the server
      trackPurchase(
        { total: 0, id: orderId }, // Replace with actual order data
        [], // Replace with actual product data
      );
    }
  }, [orderId]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white">
      <h2 className="mb-4 text-2xl font-bold">Order Completed!</h2>
      <p className="mb-2">Thank you for your order.</p>
      <p className="mb-2">Your Invoice/Order Number:</p>
      <div className="mb-4 rounded bg-gray-100 px-4 py-2 font-mono text-lg">
        {orderId}
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
