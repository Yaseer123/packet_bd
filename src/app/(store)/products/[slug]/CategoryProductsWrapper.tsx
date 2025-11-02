"use client";

import ProductsPage from "../page";

export default function CategoryProductsWrapper({
  categorySlug,
}: {
  categorySlug: string;
}) {
  // Pass the category slug directly as a prop to ProductsPage
  // This keeps the clean URL /products/{slug} and doesn't require searchParams
  return <ProductsPage initialCategorySlug={categorySlug} />;
}
