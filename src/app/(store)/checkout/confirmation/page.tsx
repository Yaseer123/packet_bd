"use client";
import { api } from "@/trpc/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");

  // Fetch order data if orderId is available (public query for both authenticated and guest users)
  const {
    data: orderData,
    isLoading,
    error,
  } = api.order.getOrderByIdPublic.useQuery(orderId!, {
    enabled: !!orderId,
    retry: false,
  });

  // Note: Purchase data is already pushed to GTM data layer from the checkout page
  // before navigation, so we don't need to push it again here
  // The Facebook Pixel tag will fire with the existing data layer values

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
