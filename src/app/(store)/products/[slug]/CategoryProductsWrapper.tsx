"use client";

import { ProductsPageContent } from "../ProductsPageContent";

export default function CategoryProductsWrapper({
  categorySlug,
}: {
  categorySlug: string;
}) {
  // Pass the category slug directly as a prop to ProductsPageContent
  // This keeps the clean URL /products/{slug} and doesn't require searchParams
  return <ProductsPageContent initialCategorySlug={categorySlug} />;
}
