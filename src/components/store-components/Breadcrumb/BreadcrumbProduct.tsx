"use client";

import { api } from "@/trpc/react";
import type { ProductWithCategory } from "@/types/ProductType";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { HomeIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface Props {
  data: ProductWithCategory;
}

const BreadcrumbProduct: React.FC<Props> = ({ data }) => {
  const {
    data: categoryHierarchy,
    isLoading,
    isError,
  } = api.category.getHierarchy.useQuery({
    id: data.categoryId!,
  });

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-secondary2">Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500">
          Failed to load category hierarchy. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="bg-surface bg-white bg-no-repeat pb-8 pt-12">
          <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 mx-auto flex w-full !max-w-[1322px] flex-nowrap items-center justify-between gap-3 overflow-x-auto whitespace-nowrap px-4">
            <div className="left flex min-w-0 items-center gap-1">
              <Link
                href={"/"}
                className="text-secondary2 truncate text-base font-normal leading-6 hover:underline md:text-base"
              >
                <HomeIcon size={16} />
              </Link>
              <CaretRight size={12} className="text-secondary2" />
              {categoryHierarchy?.map(
                (
                  cat: { id: React.Key | null | undefined; name: string },
                  index: number,
                ) => (
                  <React.Fragment key={cat.id}>
                    <Link
                      href={`/products?category=${cat.id}`}
                      className="text-secondary2 truncate text-base font-normal capitalize leading-6 hover:underline md:text-base"
                    >
                      {cat.name}
                    </Link>
                    {index < categoryHierarchy.length - 1 && (
                      <CaretRight size={12} className="text-secondary2" />
                    )}
                  </React.Fragment>
                ),
              )}
              <CaretRight size={12} className="text-secondary2" />
              <div className="truncate text-base font-normal capitalize leading-6 md:text-base">
                {data.title}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BreadcrumbProduct;
