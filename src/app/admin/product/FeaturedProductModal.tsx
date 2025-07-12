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
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface FeaturedProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  currentFeaturedStatus: boolean;
}

export function FeaturedProductModal({
  isOpen,
  onClose,
  productId,
  currentFeaturedStatus,
}: FeaturedProductModalProps) {
  const [featured, setFeatured] = useState(currentFeaturedStatus);

  // Reset selected status when modal opens or currentFeaturedStatus changes
  useEffect(() => {
    if (isOpen) {
      setFeatured(currentFeaturedStatus);
    }
  }, [isOpen, currentFeaturedStatus]);

  const utils = api.useUtils();
  const mutation = api.product.updateFeaturedStatus.useMutation({
    onSuccess: () => {
      toast.success("Featured status updated", {
        description: `Product has been ${featured ? "added to" : "removed from"} featured products.`,
      });
      onClose();
      void utils.product.getAll.invalidate();
      void utils.product.getFeaturedProducts.invalidate();
    },
    onError: (error: { message: string }) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ id: productId, featured });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Update Featured Status</DialogTitle>
          <DialogDescription>
            Choose whether this product should be featured on the homepage.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-3">
            <div
              className={`relative flex cursor-pointer items-start rounded-lg border p-4 transition-all ${
                featured
                  ? "border-emerald-200 bg-emerald-50 ring-2 ring-offset-2"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
              onClick={() => setFeatured(true)}
            >
              <div className="flex w-full items-center">
                <div className="mr-3 h-4 w-4 flex-shrink-0 rounded-full bg-emerald-500" />
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium text-emerald-700">
                      Feature this product
                    </h3>
                    {featured && (
                      <CheckCircle className="ml-2 h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    This product will appear in the featured section on the
                    homepage.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`relative flex cursor-pointer items-start rounded-lg border p-4 transition-all ${
                !featured
                  ? "border-gray-200 bg-gray-50 ring-2 ring-offset-2"
                  : "border-gray-200 hover:bg-gray-100"
              }`}
              onClick={() => setFeatured(false)}
            >
              <div className="flex w-full items-center">
                <div className="mr-3 h-4 w-4 flex-shrink-0 rounded-full bg-gray-400" />
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-700">
                      Remove from featured
                    </h3>
                    {!featured && (
                      <CheckCircle className="ml-2 h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    This product will not appear in the featured section.
                  </p>
                </div>
              </div>
            </div>
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
              disabled={
                mutation.isPending || featured === currentFeaturedStatus
              }
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
