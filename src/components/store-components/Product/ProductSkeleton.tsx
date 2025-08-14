import { Skeleton } from "@/components/ui/skeleton";

export default function ProductSkeleton() {
  return (
    <div className="product-item style-marketplace h-full min-h-[300px] rounded-[.25rem] border border-[#ddd] bg-white p-4 pt-5">
      <div className="bg-img relative w-full pt-6">
        {/* Product Image Skeleton */}
        <div className="relative overflow-hidden rounded-lg">
          <Skeleton className="aspect-square w-full" />
        </div>

        {/* Action Buttons Skeleton */}
        <div className="list-action absolute right-1 top-1 flex flex-col gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      <div className="product-info mt-4 flex flex-col">
        {/* Product Title Skeleton */}
        <div className="flex-grow">
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="mb-2 h-4 w-1/2" />
        </div>

        {/* Price Skeleton */}
        <div className="mt-auto flex items-center">
          <Skeleton className="h-6 w-20" />
        </div>

        {/* Buy Now Button Skeleton */}
        <Skeleton className="mt-4 h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
