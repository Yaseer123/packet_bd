"use client";
import { useRouter, useSearchParams } from "next/navigation";

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white">
      {/* Place FB Pixel or other tracking scripts here */}
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
