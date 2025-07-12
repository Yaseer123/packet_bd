import { api } from "@/trpc/react";
import type { ProductWithCategory } from "@/types/ProductType";
import React from "react";
import Product from "./Product";

interface RelatedProductsSidebarProps {
  categoryId?: string;
  excludeProductId: string;
}

const RelatedProductsSidebar: React.FC<RelatedProductsSidebarProps> = ({
  categoryId,
  excludeProductId,
}) => {
  const { data: products = [], isLoading } =
    api.product.getAllByCategory.useQuery(
      { categoryId },
      { enabled: !!categoryId },
    );

  // Filter out the current product and limit to 4
  const relatedProducts = Array.isArray(products)
    ? products
        .filter(
          (p): p is ProductWithCategory =>
            !!p &&
            typeof p === "object" &&
            "id" in p &&
            "title" in p &&
            "category" in p,
        )
        .filter((p) => p.id !== excludeProductId)
        .slice(0, 2)
    : [];

  if (!categoryId) return null;

  return (
    <aside className="sticky top-10 h-fit min-h-[300px] border-l border-gray-100 bg-white p-4">
      <h3 className="mb-4 text-lg font-semibold">Related Products</h3>
      {isLoading ? (
        <div className="py-8 text-center text-gray-400">Loading...</div>
      ) : relatedProducts.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          No related products found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-1">
          {relatedProducts.map((product: ProductWithCategory) => (
            <Product key={product.id} data={product} />
          ))}
        </div>
      )}
    </aside>
  );
};

export default RelatedProductsSidebar;
