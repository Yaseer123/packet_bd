export default function BlogSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="relative mb-12 flex flex-col gap-6 rounded-2xl p-6 lg:flex-row">
        {/* Cover Image Skeleton */}
        <div className="h-[250px] w-full flex-shrink-0 rounded-lg bg-gray-200 lg:w-[450px]" />

        <div className="flex flex-1 flex-col">
          {/* Tag Skeleton */}
          <div className="mb-3 h-6 w-24 rounded-full bg-gray-200" />

          {/* Description Skeleton */}
          <div className="mb-6 space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="h-4 w-4/6 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
