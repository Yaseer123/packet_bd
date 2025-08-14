"use client";

import { api } from "@/trpc/react";
import { type ProductWithCategory } from "@/types/ProductType";
import Product from "./Product/Product";
import ProductSkeleton from "./Product/ProductSkeleton";

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

  return (
    <div className="container mx-auto mt-8 px-4">
      <div className="mb-6 flex flex-col items-center justify-center md:mb-10">
        <h2
          id="featured-products"
          className="mb-1 text-2xl font-semibold sm:text-2xl md:mb-2 md:text-3xl"
        >
          Featured Products
        </h2>
        <p className="px-4 text-center text-sm text-gray-500 sm:text-base">
          Our handpicked selection of premium products
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      ) : featuredProducts.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          No featured products available at the moment.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
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
