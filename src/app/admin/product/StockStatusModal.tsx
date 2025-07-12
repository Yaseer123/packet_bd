"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/trpc/react";
import type { StockStatus } from "@prisma/client";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface StockStatusOption {
  value: StockStatus;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

const stockStatusOptions: StockStatusOption[] = [
  {
    value: "IN_STOCK",
    label: "In Stock",
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200 hover:bg-green-100",
    description: "Product is available and ready for immediate shipping",
  },
  {
    value: "OUT_OF_STOCK",
    label: "Out of Stock",
    color: "text-red-700",
    bgColor: "bg-red-500-50 border-red-200 hover:bg-red-100",
    description: "Product is currently unavailable",
  },
  {
    value: "PRE_ORDER",
    label: "Pre Order",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    description: "Product can be ordered now but will ship later",
  },
];

interface StockStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  currentStatus: StockStatus;
}

export function StockStatusModal({
  isOpen,
  onClose,
  productId,
  currentStatus,
}: StockStatusModalProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<StockStatus>(currentStatus);

  // Reset selected status when modal opens or currentStatus changes
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus);
    }
  }, [isOpen, currentStatus]);

  const utils = api.useUtils();
  const mutation = api.product.updateStockStatus.useMutation({
    onSuccess: () => {
      toast.success("Stock status updated", {
        description: "Product stock status has been updated successfully.",
      });
      onClose();
      void utils.product.getAll.invalidate();
    },
    onError: (error: { message: string }) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ id: productId, stockStatus: selectedStatus });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Update Stock Status</DialogTitle>
          <DialogDescription>
            Choose the appropriate stock status for this product.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-3">
            {stockStatusOptions.map((option) => (
              <div
                key={option.value}
                className={`relative flex cursor-pointer items-start rounded-lg border p-4 transition-all ${
                  selectedStatus === option.value
                    ? `ring-2 ring-offset-2 ${option.bgColor.replace("hover:", "")}`
                    : `border-gray-200 ${option.bgColor}`
                }`}
                onClick={() => setSelectedStatus(option.value)}
              >
                <div className="flex w-full items-center">
                  <div
                    className={`mr-3 h-4 w-4 flex-shrink-0 rounded-full ${
                      option.value === "IN_STOCK"
                        ? "bg-green-500"
                        : option.value === "OUT_OF_STOCK"
                          ? "bg-red-500"
                          : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className={`font-medium ${option.color}`}>
                        {option.label}
                      </h3>
                      {selectedStatus === option.value && (
                        <CheckCircle className="ml-2 h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || selectedStatus === currentStatus}
              className="px-4"
            >
              {mutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
