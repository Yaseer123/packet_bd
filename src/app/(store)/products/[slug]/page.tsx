import BreadcrumbProduct from "@/components/store-components/Breadcrumb/BreadcrumbProduct";
import ProductDetails from "@/components/store-components/Product/Details/ProductDetails";
import { api } from "@/trpc/server";
import type { ProductWithCategory } from "@/types/ProductType";
import Script from "next/script";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const productData = await api.product.getProductBySlug({ slug });

  if (!productData) {
    return {
      title: "Product Not Found",
      description: "The product you are looking for does not exist.",
    };
  }

  return {
    title: productData.title,
    description: productData.description,
    openGraph: {
      title: productData.title,
      description: productData.description,
      images: productData.images,
    },
    twitter: {
      card: "summary_large_image",
      title: productData.title,
      description: productData.description,
      images: productData.images[0],
    },
  };
}

const ProductPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const productData = await api.product.getProductBySlug({ slug });

  if (!productData) {
    return <div>Product not found</div>;
  }

  // productData is now already processed by toProductWithCategory
  const fixedProductData: ProductWithCategory = {
    ...productData,
    maxQuantity: productData.maxQuantity ?? null,
    minQuantity: productData.minQuantity,
    quantityStep: productData.quantityStep,
  };

  // Prepare JSON-LD data for Meta Catalogue compatibility
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    // Required Meta fields
    id: fixedProductData.id?.toString() ?? slug, // Unique product ID
    name: fixedProductData.title, // Product title
    description:
      fixedProductData.description ?? fixedProductData.shortDescription ?? "",
    image:
      Array.isArray(fixedProductData.images) &&
      fixedProductData.images.length > 0
        ? fixedProductData.images.map((img) =>
            img.startsWith("http") ? img : `${process.env.NEXTAUTH_URL}${img}`,
          )
        : undefined,
    sku: fixedProductData.sku ?? slug,
    brand: {
      "@type": "Brand",
      name: fixedProductData.brand ?? "Brand",
    },
    offers: {
      "@type": "Offer",
      // Required Meta fields
      url: `${process.env.NEXTAUTH_URL}/products/${slug}`, // Product link
      priceCurrency: "BDT",
      price: fixedProductData.discountedPrice ?? fixedProductData.price ?? 0,
      priceValidUntil: "2025-12-31",
      itemCondition: "https://schema.org/NewCondition",
      // Required Meta availability field
      availability:
        fixedProductData.stockStatus === "IN_STOCK" ||
        (typeof fixedProductData.stock === "number" &&
          fixedProductData.stock > 0)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    // Additional Meta-recommended fields
    category: fixedProductData.category?.name,
    mpn: fixedProductData.sku ?? slug, // Manufacturer Part Number
    gtin: fixedProductData.sku ?? slug, // Global Trade Item Number
  };

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BreadcrumbProduct data={fixedProductData} />
      <ProductDetails productMain={fixedProductData} />
    </>
  );
};

export default ProductPage;
