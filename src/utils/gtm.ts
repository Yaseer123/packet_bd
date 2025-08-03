// GTM Data Layer utility functions

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

export interface ProductData {
  id: string;
  title: string;
  slug: string;
  productCode?: string | null;
  sku?: string | null;
  price: number;
  discountedPrice?: number | null;
  brand?: string | null;
  category?:
    | {
        name?: string | null;
      }
    | null
    | string;
  images?: string[];
  shortDescription?: string | null;
  description?: string | null;
}

/**
 * Push product data to GTM data layer before navigation
 * This ensures the data is available when the view content event fires
 */
export const pushProductToDataLayer = (product: ProductData) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    // Clear previous ecommerce data
    window.dataLayer.push({ ecommerce: null });

    // Push product data to data layer
    window.dataLayer.push({
      event: "product_view",
      ecommerce: {
        currencyCode: "BDT",
        detail: {
          products: [
            {
              name: product.title,
              id: product.id,
              price: product.discountedPrice ?? product.price,
              brand: product.brand ?? "Brand",
              category:
                typeof product.category === "string"
                  ? product.category
                  : product.category?.name,
              sku: product.sku,
              productCode: product.productCode,
            },
          ],
        },
      },
      // Additional custom dimensions for easy access
      product_id: product.id,
      product_code: product.productCode,
      product_sku: product.sku,
      product_name: product.title,
      product_price: product.discountedPrice ?? product.price,
      product_currency: "BDT",
      product_brand: product.brand,
      product_category:
        typeof product.category === "string"
          ? product.category
          : product.category?.name,
      product_slug: product.slug,
    });

    console.log("GTM: Product data pushed to data layer:", {
      productCode: product.productCode,
      id: product.id,
      name: product.title,
      price: product.discountedPrice ?? product.price,
    });
  }
};

/**
 * Push product click event to GTM data layer
 * Use this for product list clicks, search results, etc.
 */
export const pushProductClickToDataLayer = (
  product: ProductData,
  listName?: string,
) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "product_click",
      ecommerce: {
        currencyCode: "BDT",
        click: {
          products: [
            {
              name: product.title,
              id: product.id,
              price: product.discountedPrice ?? product.price,
              brand: product.brand ?? "Brand",
              category:
                typeof product.category === "string"
                  ? product.category
                  : product.category?.name,
              sku: product.sku,
              productCode: product.productCode,
              list: listName,
            },
          ],
        },
      },
      // Additional custom dimensions
      product_id: product.id,
      product_code: product.productCode,
      product_sku: product.sku,
      product_name: product.title,
      product_price: product.discountedPrice ?? product.price,
      product_currency: "BDT",
      product_brand: product.brand,
      product_category:
        typeof product.category === "string"
          ? product.category
          : product.category?.name,
      product_slug: product.slug,
      list_name: listName,
    });

    console.log("GTM: Product click pushed to data layer:", {
      productCode: product.productCode,
      id: product.id,
      name: product.title,
      listName,
    });
  }
};
