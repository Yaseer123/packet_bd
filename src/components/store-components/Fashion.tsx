"use client";

import { api } from "@/trpc/react";
import { type ProductWithCategory } from "@/types/ProductType";
import type { Category } from "@prisma/client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Product from "./Product/Product";
import ProductSkeleton from "./Product/ProductSkeleton";

function isProductWithCategory(val: unknown): val is ProductWithCategory {
  if (!val || typeof val !== "object") return false;
  return "id" in val &&
    "title" in val &&
    "images" in val &&
    "price" in val &&
    "discountedPrice" in val &&
    "category" in val
    ? true
    : false;
}

const RecentlyAdded = () => {
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = api.category.getAllParentOrderedByRecentProduct.useQuery();

  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  function getAllByCategoryQuery(categoryId: string | undefined) {
    return api.product.getAllByCategory.useQuery(
      { categoryId },
      {
        enabled: !!categoryId, // Only fetch products if a category is selected
      },
    );
  }

  const {
    data: products = [],
    isLoading: isProductsLoading,
    isError: isProductsError,
  } = getAllByCategoryQuery(activeTab);

  const handleTabClick = (categoryId: string) => {
    setActiveTab(categoryId);
  };
  console.log(products);
  // Set the default active tab to the first category when categories are loaded
  useEffect(() => {
    if (categories?.length && !activeTab && categories[0]) {
      setActiveTab(categories[0].id);
    }
  }, [categories, activeTab]);

  if (isCategoriesLoading) {
    return (
      <div className="tab-features-block pt-8 md:pt-20">
        <div className="container">
          <div className="heading flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-5">
            <div className="heading3 mb-2 md:mb-0">Recently Added</div>
            <div className="relative w-full overflow-hidden md:w-auto">
              <div className="menu-tab scrollbar-hide bg-surface flex items-center gap-2 overflow-x-auto whitespace-nowrap rounded-2xl p-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex-shrink-0 px-5 py-2">
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-300"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="list-product hide-product-sold mt-6 grid grid-cols-2 gap-[20px] sm:grid-cols-2 sm:gap-[30px] md:mt-10 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isCategoriesError) {
    return (
      <div className="py-10 text-center text-red-500">
        Failed to load categories. Please try again later.
      </div>
    );
  }

  return (
    <>
      <div className="tab-features-block pt-8 md:pt-20">
        <div className="container">
          <div className="heading flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-5">
            <div className="heading3 mb-2 md:mb-0">Recently Added</div>
            <div className="relative w-full overflow-hidden md:w-auto">
              <div className="menu-tab scrollbar-hide bg-surface flex items-center gap-2 overflow-x-auto whitespace-nowrap rounded-2xl p-1">
                {categories?.map((category: Category) => (
                  <div
                    id={`tab-${category.id}`}
                    key={category.id}
                    className={`tab-item relative flex-shrink-0 cursor-pointer px-5 py-2 text-secondary duration-500 ${
                      activeTab === category.id ? "active" : ""
                    }`}
                    onClick={() => handleTabClick(category.id)}
                  >
                    {activeTab === category.id && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 rounded-2xl bg-white"
                      ></motion.div>
                    )}
                    <span className="text-button-uppercase relative z-[1]">
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="from-surface pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l to-transparent md:hidden"></div>
              <div className="from-surface pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r to-transparent md:hidden"></div>
            </div>
          </div>

          {isProductsLoading ? (
            <div className="list-product hide-product-sold mt-6 grid grid-cols-2 gap-[20px] sm:grid-cols-2 sm:gap-[30px] md:mt-10 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : isProductsError ? (
            <div className="mt-6 text-center text-red-500">
              Failed to load products. Please try again later.
            </div>
          ) : products?.length === 0 ? (
            <div className="mt-6 py-10 text-center">
              No products available in this category.
            </div>
          ) : (
            <div className="list-product hide-product-sold mt-6 grid grid-cols-2 gap-[20px] sm:grid-cols-2 sm:gap-[30px] md:mt-10 md:grid-cols-3 lg:grid-cols-4">
              {products
                ?.slice(0, 12)
                .filter(isProductWithCategory)
                .map((prd, index: number) =>
                  isProductWithCategory(prd) ? (
                    <Product key={index} data={prd} style="style-1" />
                  ) : null,
                )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RecentlyAdded;
