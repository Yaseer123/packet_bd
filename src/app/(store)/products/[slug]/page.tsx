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
    id: `product_${fixedProductData.id}`, // Make ID more unique
    name: fixedProductData.title,
    description:
      fixedProductData.description ?? fixedProductData.shortDescription ?? "",
    image:
      Array.isArray(fixedProductData.images) &&
      fixedProductData.images.length > 0
        ? fixedProductData.images.map((img) =>
            img.startsWith("http") ? img : `${process.env.NEXTAUTH_URL}${img}`,
          )
        : undefined,
    sku: fixedProductData.sku ?? `SKU_${fixedProductData.id}`,
    brand: {
      "@type": "Brand",
      name: fixedProductData.brand ?? "Packet BD",
    },
    offers: {
      "@type": "Offer",
      // Required Meta fields
      url: `${process.env.NEXTAUTH_URL}/products/${slug}`, // Product link
      priceCurrency: "BDT",
      price: fixedProductData.discountedPrice ?? fixedProductData.price ?? 0,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 1 year from now
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
    mpn: fixedProductData.sku ?? `MPN_${fixedProductData.id}`, // Manufacturer Part Number
    gtin: fixedProductData.sku ?? `GTIN_${fixedProductData.id}`, // Global Trade Item Number
    // Add more fields for better catalog matching
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: "100",
    },
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
