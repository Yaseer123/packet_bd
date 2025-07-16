import BreadcrumbProduct from "@/components/store-components/Breadcrumb/BreadcrumbProduct";
import ProductDetails from "@/components/store-components/Product/Details/ProductDetails";
import { api } from "@/trpc/server";
import type { ProductWithCategory, Variant } from "@/types/ProductType";
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

function isVariantArray(val: unknown): val is Variant[] {
  return (
    Array.isArray(val) &&
    val.every(
      (v) =>
        typeof v === "object" &&
        v !== null &&
        ("price" in v || "color" in v || "size" in v),
    )
  );
}

function isString(val: unknown): val is string {
  return typeof val === "string";
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

  let variants: Variant[] | string | null = null;
  if (isVariantArray(productData.variants)) {
    variants = productData.variants.map((v) => ({ ...v }));
  } else if (isString(productData.variants)) {
    variants = productData.variants;
  } else {
    variants = null;
  }
  const productDataTyped = productData as ProductWithCategory;
  const fixedProductData: ProductWithCategory = {
    ...productDataTyped,
    variants: variants as unknown as ProductWithCategory["variants"],
    maxQuantity: productDataTyped.maxQuantity ?? null,
    minQuantity: productDataTyped.minQuantity,
    quantityStep: productDataTyped.quantityStep,
  };

  // Prepare JSON-LD data
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: fixedProductData.title,
    image:
      Array.isArray(fixedProductData.images) &&
      fixedProductData.images.length > 0
        ? fixedProductData.images.map((img) =>
            img.startsWith("http") ? img : `${process.env.NEXTAUTH_URL}${img}`,
          )
        : undefined,
    description:
      fixedProductData.description ?? fixedProductData.shortDescription ?? "",
    sku: fixedProductData.sku ?? slug,
    brand: {
      "@type": "Brand",
      name: fixedProductData.brand ?? "Brand",
    },
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXTAUTH_URL}/products/${slug}`,
      priceCurrency: "BDT",
      price: fixedProductData.discountedPrice ?? fixedProductData.price ?? 0,
      priceValidUntil: "2025-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability:
        fixedProductData.stockStatus === "IN_STOCK" ||
        (typeof fixedProductData.stock === "number" &&
          fixedProductData.stock > 0)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
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
