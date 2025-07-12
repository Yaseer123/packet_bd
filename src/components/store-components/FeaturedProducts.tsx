"use client";

import { api } from "@/trpc/react";
import { type ProductWithCategory } from "@/types/ProductType";
import Product from "./Product/Product";

function isProductWithCategory(val: unknown): val is ProductWithCategory {
  if (!val || typeof val !== "object") return false;
  return (
    "id" in val &&
    "title" in val &&
    "images" in val &&
    "price" in val &&
    "discountedPrice" in val &&
    "category" in val
  );
}

export default function FeaturedProducts() {
  const { data: featuredProducts = [], isLoading } =
    api.product.getFeaturedProducts.useQuery(
      { limit: 9999999 },
      { refetchOnWindowFocus: false },
    );

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto mt-8 px-4">
      <div className="mb-6 flex flex-col items-center justify-center md:mb-10">
        <h2 className="mb-1 text-2xl font-semibold sm:text-2xl md:mb-2 md:text-3xl">
          Featured Products
        </h2>
        <p className="px-4 text-center text-sm text-gray-500 sm:text-base">
          Our handpicked selection of premium products
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-black sm:h-10 sm:w-10"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-5 lg:grid-cols-4">
          {featuredProducts.filter(isProductWithCategory).map((product) => {
            if (isProductWithCategory(product)) {
              return <Product key={product.id} data={product} />;
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
