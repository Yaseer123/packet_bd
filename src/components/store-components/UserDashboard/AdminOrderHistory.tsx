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

interface AdminOrderHistoryProps {
  activeTab?: string;
  userId: string;
}

export default function AdminOrderHistory({ activeTab, userId }: AdminOrderHistoryProps) {
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
  } = api.order.getOrdersByUserId.useQuery(userId, {
    enabled: activeTab === "orders",
  });

  // Filter orders by status if a specific status is selected
  const filteredOrders = activeOrders 
    ? orders?.filter(order => order.status === activeOrders)
    : orders;

  const cancelOrderMutation = api.order.cancelOrder.useMutation({
    onSuccess: () => {
      toast.success("Order canceled successfully.");
      setCancelOrderId(null); // Close the modal
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to cancel the order.";
      toast.error(errorMessage);
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
      <h6 className="heading6">User Orders</h6>
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
        ) : filteredOrders?.length === 0 ? (
          <div className="mt-5 text-center">No orders found.</div>
        ) : (
          filteredOrders?.map((order) => (
            <div
              key={order.id}
              className="order-item mt-4 rounded-lg border border-[#ddd] p-4"
            >
              <div className="order-header flex items-center justify-between">
                <div className="order-info">
                  <h6 className="font-semibold">Order #{order.id}</h6>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="order-status">
                  <Badge
                    variant={undefined}
                    className={ORDER_STATUS_COLORS[order.status]?.color}
                  >
                    {ORDER_STATUS_COLORS[order.status]?.label ?? order.status}
                  </Badge>
                </div>
              </div>
              <div className="order-items mt-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="item flex items-center gap-3 border-b border-gray-100 py-2 last:border-b-0"
                  >
                    <div className="item-image">
                      <Image
                        src={item.product?.images?.[0] ?? "/images/placeholder.png"}
                        width={50}
                        height={50}
                        alt={item.product?.title ?? "Product"}
                        className="rounded"
                      />
                    </div>
                    <div className="item-details flex-1">
                      <h6 className="font-medium">{item.product?.title}</h6>
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity} | Price: ৳{item.price}
                      </p>
                      {item.color && (
                        <p className="text-sm text-gray-600">Color: {item.color}</p>
                      )}
                      {item.size && (
                        <p className="text-sm text-gray-600">Size: {item.size}</p>
                      )}
                    </div>
                    <div className="item-total">
                      <p className="font-semibold">৳{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="order-footer mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="order-total">
                  <p className="font-semibold">Total: ৳{order.total}</p>
                </div>
                <div className="order-actions flex gap-2">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View Details
                  </Link>
                  {order.status === "PENDING" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setCancelOrderId(order.id)}
                    >
                      Cancel Order
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cancel Order Dialog */}
      <Dialog open={!!cancelOrderId} onOpenChange={() => setCancelOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to cancel this order?</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOrderId(null)}
            >
              No, Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending ? "Canceling..." : "Yes, Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 