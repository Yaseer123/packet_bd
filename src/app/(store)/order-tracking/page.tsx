"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { useState } from "react";
// import TopNav from '@/components/store-components/TopNav'
import Breadcrumb from "@/components/store-components/Breadcrumb/Breadcrumb";
import Footer from "@/components/store-components/Footer";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_COLORS } from "@/utils/constants";
import { HomeIcon } from "lucide-react";

// Define the expected order result type
interface OrderResult {
  orderId: string;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  total: number;
  createdAt: Date;
  items: Array<{
    productId: string;
    productTitle: string | null;
    quantity: number;
    price: number;
  }>;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
    name: string | null;
  } | null;
}

const OrderTracking = () => {
  const [invoice, setInvoice] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/order-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice }),
      });

      if (!res.ok) {
        throw new Error(
          "Order not found. Please check your invoice number and try again.",
        );
      }
      const data = (await res.json()) as OrderResult;
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div id="header" className="relative w-full">
        <Breadcrumb
          items={[
            { label: <HomeIcon size={16} />, href: "/" },
            { label: "Order Tracking" },
          ]}
          pageTitle="Order Tracking"
        />
      </div>
      <div className="order-tracking py-10 md:py-20">
        <div className="container">
          <div className="content-main flex gap-y-8 max-md:flex-col">
            <div className="left w-full md:w-1/2 md:pr-[40px] lg:pr-[60px]">
              <div className="heading4">Order Tracking</div>
              <div className="mt-2">
                To track your order, please enter your Invoice or Order Number
                below and press the {String.raw`"`}Track{String.raw`"`} button.
                This was given to you on your receipt and in the confirmation
                email you should have received.
              </div>
              <form className="mt-4 md:mt-7" onSubmit={handleSubmit}>
                <div className="invoice">
                  <input
                    className="w-full rounded-lg border-[#ddd] px-4 pb-3 pt-3 focus:border-[#ddd]"
                    id="invoice"
                    type="text"
                    placeholder="Invoice or Order Number *"
                    required
                    value={invoice}
                    onChange={(e) => setInvoice(e.target.value)}
                  />
                </div>
                <div className="block-button mt-4 md:mt-7">
                  <button
                    className="button-main"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Tracking..." : "Tracking Orders"}
                  </button>
                </div>
              </form>
              {result && (
                <div className="mt-4 rounded bg-green-100 p-4">
                  <strong>Order ID:</strong> {result.orderId} <br />
                  <strong>Status:</strong>{" "}
                  <Badge
                    variant={undefined}
                    className={ORDER_STATUS_COLORS[result.status]?.color}
                  >
                    {ORDER_STATUS_COLORS[result.status]?.label ?? result.status}
                  </Badge>
                  {/* Add more fields as needed */}
                </div>
              )}
              {error && (
                <div className="mt-4 rounded bg-red-100 p-4 text-red-700">
                  {error}
                </div>
              )}
            </div>
            {/* Only show to non-logged-in users */}
            {!session && (
              <div className="right flex w-full items-center border-[#ddd] focus:border-[#ddd] md:w-1/2 md:border-l md:pl-[40px] lg:pl-[60px]">
                <div className="text-content">
                  <div className="heading4">Already have an account?</div>
                  <div className="mt-2 text-secondary">
                    Welcome back. Sign in to access your personalized
                    experience, saved preferences, and more. We{"'re"} thrilled
                    to have you with us again!
                  </div>
                  <div className="block-button mt-4 md:mt-7">
                    <Link href={"/login"} className="button-main">
                      Login
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OrderTracking;
