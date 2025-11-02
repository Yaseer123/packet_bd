import BreadcrumbProduct from "@/components/store-components/Breadcrumb/BreadcrumbProduct";
import ProductDetails from "@/components/store-components/Product/Details/ProductDetails";
import { api } from "@/trpc/server";
import type { ProductWithCategory } from "@/types/ProductType";
import Link from "next/link";
import CategoryProductsWrapper from "./CategoryProductsWrapper";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check if it's a category first
  try {
    const category = await api.category.getBySlug({ slug });
    return {
      title: category.name,
      description:
        category.description ?? `Browse our ${category.name} collection`,
    };
  } catch {
    // Not a category, check if it's a product
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
}

const ProductOrCategoryPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  // Check if it's a category first
  try {
    const categoryData = await api.category.getBySlug({ slug });
    // If category is found, render products page with this category
    // Keep the SEO-friendly URL: /products/{slug}
    return <CategoryProductsWrapper categorySlug={slug} />;
  } catch (error) {
    // Category not found - this is expected for product slugs
    // Continue to check for product
  }

  // Not a category, try product
  const productData = await api.product.getProductBySlug({ slug });

  if (!productData) {
    // Neither category nor product found
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Not Found</h1>
        <p className="mb-8 text-gray-600">
          The category or product you are looking for does not exist.
        </p>
        <Link
          href="/products"
          className="hover:bg-brand-primary/90 inline-block rounded bg-brand-primary px-6 py-3 text-white transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  // productData is now already processed by toProductWithCategory
  const fixedProductData: ProductWithCategory = {
    ...productData,
    maxQuantity: productData.maxQuantity ?? null,
    minQuantity: productData.minQuantity,
    quantityStep: productData.quantityStep,
  };

  return (
    <>
      {/* Immediate GTM push for fastest event firing */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof window !== "undefined" && window.dataLayer) {
                const startTime = performance.now();
                const productId = ${JSON.stringify(fixedProductData.id)};
                
                // Prevent duplicate events
                if (window.productViewFired && window.productViewFired.has(productId)) {
                  console.log("GTM: Product view event already fired for product:", productId);
                  return;
                }
                
                try {
                  // Clear previous ecommerce data
                  window.dataLayer.push({ ecommerce: null });
                  
                  // Push product data to data layer immediately
                  window.dataLayer.push({
                    event: "product_view",
                    ecommerce: {
                      currencyCode: "BDT",
                      detail: {
                        products: [{
                          name: ${JSON.stringify(fixedProductData.title)},
                          id: ${JSON.stringify(fixedProductData.id)},
                          price: ${fixedProductData.discountedPrice ?? fixedProductData.price},
                          brand: ${JSON.stringify(fixedProductData.brand ?? "Brand")},
                          category: ${JSON.stringify(typeof fixedProductData.category === "string" ? fixedProductData.category : (fixedProductData.category?.name ?? ""))},
                          sku: ${JSON.stringify(fixedProductData.sku ?? "")},
                          productCode: ${JSON.stringify(fixedProductData.productCode ?? "")}
                        }]
                      }
                    },
                    product_id: ${JSON.stringify(fixedProductData.id)},
                    product_code: ${fixedProductData.productCode ? JSON.stringify([fixedProductData.productCode]) : "[]"},
                    product_sku: ${JSON.stringify(fixedProductData.sku ?? "")},
                    product_name: ${JSON.stringify(fixedProductData.title)},
                    product_price: ${fixedProductData.discountedPrice ?? fixedProductData.price},
                    product_currency: "BDT",
                    product_brand: ${JSON.stringify(fixedProductData.brand ?? "")},
                    product_category: ${JSON.stringify(typeof fixedProductData.category === "string" ? fixedProductData.category : (fixedProductData.category?.name ?? ""))},
                    product_slug: ${JSON.stringify(fixedProductData.slug)}
                  });
                  
                  // Mark event as fired
                  if (!window.productViewFired) {
                    window.productViewFired = new Set();
                  }
                  window.productViewFired.add(productId);
                  
                  const endTime = performance.now();
                  console.log("GTM: Immediate product view event fired in " + (endTime - startTime).toFixed(2) + "ms", {
                    productCode: ${JSON.stringify(fixedProductData.productCode)},
                    id: ${JSON.stringify(fixedProductData.id)},
                    name: ${JSON.stringify(fixedProductData.title)},
                    price: ${fixedProductData.discountedPrice ?? fixedProductData.price},
                    timestamp: new Date().toISOString()
                  });
                } catch (error) {
                  console.error("GTM: Error pushing immediate product view event:", error);
                }
              }
            })();
          `,
        }}
      />
      <BreadcrumbProduct data={fixedProductData} />
      <ProductDetails productMain={fixedProductData} />
    </>
  );
};

export default ProductOrCategoryPage;
