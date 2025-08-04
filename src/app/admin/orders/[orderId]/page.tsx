"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import InvoiceGenerator from "@/components/admin-components/InvoiceGenerator";
import { api, type RouterOutputs } from "@/trpc/react";
import { ORDER_STATUS_COLORS } from "@/utils/constants";
import type { OrderStatus } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Package, User, MapPin, CreditCard, Calendar, FileText } from "lucide-react";

const statusOptions = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

type OrderType = RouterOutputs["order"]["getOrderByIdAdmin"];

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = api.order.getOrderByIdAdmin.useQuery(orderId);

  const updateStatus = api.order.updateOrderStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | null>(null);

  if (isLoading) {
    return (
      <div className="p-4 md:p-10">
        <div className="flex items-center justify-center">
          <div className="text-lg">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="p-4 md:p-10">
        <div className="flex items-center justify-center">
          <div className="text-lg text-red-500">Failed to load order details.</div>
        </div>
      </div>
    );
  }

  const handleStatusUpdate = () => {
    if (newStatus && newStatus !== order.status) {
      setIsUpdatingStatus(true);
      updateStatus.mutate(
        {
          orderId: order.id,
          status: newStatus,
        },
        {
          onSuccess: () => {
            setIsUpdatingStatus(false);
            setNewStatus(null);
          },
          onError: () => {
            setIsUpdatingStatus(false);
          },
        }
      );
    }
  };

  return (
    <div className="p-4 md:p-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 w-fit"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Orders</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Order Details</h1>
            <p className="text-gray-600 text-sm sm:text-base">Order ID: {order.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={undefined}
            className={ORDER_STATUS_COLORS[order.status]?.color}
          >
            {ORDER_STATUS_COLORS[order.status]?.label ?? order.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg border p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package size={20} />
              Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm sm:text-base">{item.product?.title ?? "Product not found"}</h3>
                    <div className="text-xs sm:text-sm text-gray-600 space-y-1 mt-2">
                      <p>SKU: {item.sku ?? "N/A"}</p>
                      <p>Quantity: {item.quantity}</p>
                      <p>Price: ৳{item.price}</p>
                      {item.color && <p>Color: {item.color}</p>}
                      {item.size && <p>Size: {item.size}</p>}
                      {item.deliveryMethod && <p>Delivery: {item.deliveryMethod}</p>}
                      {item.variantLabel && <p>Variant: {item.variantLabel}</p>}
                    </div>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="font-semibold text-sm sm:text-base">৳{item.price * item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm sm:text-base">Total:</span>
                <span className="text-lg sm:text-xl font-bold">৳{order.total}</span>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="bg-white rounded-lg border p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Order Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Order ID</p>
                <p className="font-mono text-sm sm:text-base break-all">{order.id}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Created At</p>
                <p className="text-sm sm:text-base">{format(new Date(order.createdAt), "PPP 'at' p")}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Updated At</p>
                <p className="text-sm sm:text-base">{format(new Date(order.updatedAt), "PPP 'at' p")}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Status</p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={undefined}
                    className={ORDER_STATUS_COLORS[order.status]?.color}
                  >
                    {ORDER_STATUS_COLORS[order.status]?.label ?? order.status}
                  </Badge>
                </div>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs sm:text-sm text-gray-600">Notes</p>
                  <p className="bg-gray-50 p-2 rounded text-sm sm:text-base">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg border p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} />
              Customer Information
            </h2>
            {order.user ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Name</p>
                  <p className="font-medium text-sm sm:text-base">{order.user.name ?? "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Email</p>
                  <p className="font-medium text-sm sm:text-base break-all">{order.user.email}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">User ID</p>
                  <p className="font-medium text-sm sm:text-base break-all">{order.user.id}</p>
                </div>
                <Link
                  href={`/admin/user/${order.user.id}/account`}
                  className="inline-block mt-2 text-blue-600 hover:text-blue-800 underline text-sm sm:text-base"
                >
                  View Customer Profile
                </Link>
              </div>
            ) : (
              <p className="text-gray-500 text-sm sm:text-base">No user information available</p>
            )}
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg border p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Shipping Address
            </h2>
            {order.address ? (
              <div className="space-y-2">
                <p className="font-medium text-sm sm:text-base">{order.address.name || "N/A"}</p>
                <p className="text-sm sm:text-base">{order.address.street}</p>
                <p className="text-sm sm:text-base">{order.address.city}, {order.address.state} {order.address.zipCode}</p>
                <p className="text-sm sm:text-base">Phone: {order.address.phone}</p>
                <p className="text-sm sm:text-base break-all">Email: {order.address.email}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm sm:text-base">No address information available</p>
            )}
          </div>

          {/* Status Update */}
          <div className="bg-white rounded-lg border p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              Update Status
            </h2>
            <div className="space-y-3">
              <select
                value={newStatus ?? order.status}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full rounded border px-3 py-2 text-sm sm:text-base"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleStatusUpdate}
                disabled={isUpdatingStatus || !newStatus || newStatus === order.status}
                className="w-full"
              >
                {isUpdatingStatus ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </div>

          {/* Invoice Generator */}
          <div className="bg-white rounded-lg border p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} />
              Generate Invoice
            </h2>
            <InvoiceGenerator order={order} />
          </div>
        </div>
      </div>
    </div>
  );
} 