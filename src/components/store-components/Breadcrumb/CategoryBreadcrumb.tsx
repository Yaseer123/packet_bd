"use client";

import { api } from "@/trpc/react";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { HomeIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

interface Props {
  categoryId?: string | null;
  pageTitle?: string;
}

const CategoryBreadcrumb: React.FC<Props> = ({ categoryId, pageTitle }) => {
  const {
    data: categoryHierarchy,
    isLoading,
    isError,
  } = api.category.getHierarchy.useQuery(
    {
      id: categoryId ?? "",
    },
    {
      enabled: !!categoryId,
    },
  );

  return (
    <>
      <div>
        <div className="bg-surface bg-white bg-no-repeat pb-6 pt-8 md:pb-8 md:pt-12">
          <div className="mx-auto w-full !max-w-[1322px] px-3 md:px-4">
            <div className="left flex flex-wrap items-center gap-x-1 gap-y-2">
              <Link
                href={"/"}
                className="text-secondary2 text-base font-normal leading-6 hover:underline md:text-base"
              >
                <HomeIcon size={16} />
              </Link>
              <CaretRight size={10} className="text-secondary2 md:size-3" />

              {!categoryId ? (
                <div className="text-base font-normal capitalize leading-6 md:text-base">
                  {pageTitle ?? "Products"}
                </div>
              ) : isLoading ? (
                <div className="text-secondary2 text-base font-normal leading-6 md:text-base">
                  Loading...
                </div>
              ) : isError ? (
                <div className="text-base font-normal leading-6 text-red-500 md:text-base">
                  Error loading category
                </div>
              ) : (
                categoryHierarchy?.map(
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
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryBreadcrumb;
