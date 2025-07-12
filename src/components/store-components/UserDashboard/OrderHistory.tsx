"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import { ORDER_STATUS_COLORS } from "@/utils/constants";
import type { OrderStatus } from "@prisma/client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function OrderHistory({ activeTab }: { activeTab?: string }) {
  const [activeOrders, setActiveOrders] = useState<OrderStatus | undefined>(
    undefined,
  );
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);

  const orderStatusMapping = {
    all: undefined,
    pending: "PENDING",
    processing: "PROCESSING",
    delivery: "SHIPPED",
    completed: "DELIVERED",
    canceled: "CANCELLED",
  };

  const {
    data: orders,
    isLoading,
    isError,
  } = api.order.getOrderbyStatus.useQuery(activeOrders, {
    enabled: true, // Always fetch orders when the status changes
  });

  const cancelOrderMutation = api.order.cancelOrder.useMutation({
    onSuccess: () => {
      toast.success("Order canceled successfully.");
      setCancelOrderId(null); // Close the modal
    },
    onError: (error: { message: string }) => {
      toast.error(error.message || "Failed to cancel the order.");
    },
  });

  const handleActiveOrders = (order: OrderStatus | undefined) => {
    setActiveOrders(order);
  };

  const handleCancelOrder = () => {
    if (cancelOrderId) {
      cancelOrderMutation.mutate(cancelOrderId);
    }
  };

  return (
    <div
      className={`tab text-content w-full overflow-hidden rounded-xl border border-[#ddd] p-7 focus:border-[#ddd] ${
        activeTab === "orders" ? "block" : "hidden"
      }`}
    >
      <h6 className="heading6">Your Orders</h6>
      <div className="w-full overflow-x-auto">
        <div className="menu-tab mt-3 grid grid-cols-6 border-b border-[#ddd] focus:border-[#ddd] max-lg:w-[500px]">
          {Object.entries(orderStatusMapping).map(([key, value]) => (
            <button
              key={key}
              className={`item relative px-3 py-2.5 text-center duration-300`}
              onClick={() => handleActiveOrders(value as OrderStatus)}
            >
              {activeOrders === value && (
                <motion.span
                  layoutId="active-pill"
                  className="absolute inset-0 border-b-2 border-black"
                ></motion.span>
              )}
              <span className="text-button relative z-[1]">{key}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="list_order">
        {isLoading ? (
          <div className="mt-5 text-center">Loading orders...</div>
        ) : isError ? (
          <div className="mt-5 text-center text-red-500">
            Failed to load orders. Please try again later.
          </div>
        ) : orders?.length === 0 ? (
          <div className="mt-5 text-center">No orders found.</div>
        ) : (
          orders?.map(
            (order: {
              id: string;
              status: string;
              items: {
                id: string;
                product: {
                  slug: string;
                  id: string;
                  images: string[];
                  title: string;
                  price: number;
                };
                quantity: number;
              }[];
            }) => (
              <div
                key={order.id}
                className="order_item box-shadow-xs mt-5 rounded-lg border border-[#ddd] focus:border-[#ddd]"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ddd] p-5 focus:border-[#ddd]">
                  <div className="flex items-center gap-2">
                    <strong className="text-title">Order Number:</strong>
                    <strong className="order_number text-button uppercase">
                      {order.id}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong className="text-title">Order status:</strong>
                    <Badge
                      variant={undefined}
                      className={ORDER_STATUS_COLORS[order.status]?.color}
                    >
                      {ORDER_STATUS_COLORS[order.status]?.label ?? order.status}
                    </Badge>
                  </div>
                </div>
                <div className="list_prd px-5">
                  {order.items.map(
                    (item: {
                      id: string;
                      product: {
                        slug: string;
                        id: string;
                        images: string[];
                        title: string;
                        price: number;
                      };
                      quantity: number;
                    }) => (
                      <div
                        key={item.id}
                        className="prd_item flex flex-wrap items-center justify-between gap-3 border-b border-[#ddd] py-5 focus:border-[#ddd]"
                      >
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="flex items-center gap-5"
                        >
                          <div className="bg-img aspect-square w-20 flex-shrink-0 overflow-hidden rounded-lg md:w-[100px]">
                            <Image
                              src={
                                item.product.images[0] ??
                                "/images/product/1000x1000.png"
                              }
                              width={1000}
                              height={1000}
                              alt={item.product.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="prd_name text-title">
                              {item.product.title}
                            </div>
                          </div>
                        </Link>
                        <div className="text-title">
                          <span className="prd_quantity">{item.quantity}</span>
                          <span> X </span>
                          <span className="prd_price">
                            ৳{item.product.price}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
                {order.status === "PENDING" && (
                  <div className="flex flex-wrap gap-4 p-5">
                    <Button
                      className="bg-red-500 text-white hover:bg-red-600"
                      variant="destructive"
                      onClick={() => setCancelOrderId(order.id)}
                    >
                      Cancel Order
                    </Button>
                  </div>
                )}
              </div>
            ),
          )
        )}
      </div>

      <Dialog
        open={!!cancelOrderId}
        onOpenChange={() => setCancelOrderId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to cancel this order?</p>
          <DialogFooter>
            <Button
              className="bg-gray-500 hover:bg-gray-600"
              variant="secondary"
              onClick={() => setCancelOrderId(null)}
            >
              No, Go Back
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
