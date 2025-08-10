// GTM Data Layer utility functions

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: unknown[];
    productViewFired?: Set<string>;
  }
}

// Track fired events to prevent duplicates
const firedEvents = new Set<string>();

/**
 * Clear fired events tracking (useful for testing)
 */
export const clearFiredEvents = () => {
  firedEvents.clear();
  if (typeof window !== "undefined" && window.productViewFired) {
    window.productViewFired.clear();
  }
};

/**
 * Get fired events count (useful for debugging)
 */
export const getFiredEventsCount = () => {
  return {
    clientSide: firedEvents.size,
    serverSide:
      typeof window !== "undefined" && window.productViewFired
        ? window.productViewFired.size
        : 0,
  };
};

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

export interface PurchaseProductData {
  id: string;
  name: string;
  price: number;
  quantity: number;
  productCode?: string | null;
  sku?: string | null;
  brand?: string | null;
  category?: string | null;
}

export interface PurchaseData {
  orderId: string;
  total: number;
  products: PurchaseProductData[];
}

export interface CartItemData {
  id: string;
  name: string;
  price: number;
  discountedPrice?: number | null;
  quantity: number;
  productCode?: string | null;
  sku?: string | null;
  brand?: string | null;
  category?: string | null;
}

export interface CartData {
  total: number;
  items: CartItemData[];
}

/**
 * Push product data to GTM data layer before navigation
 * This ensures the data is available when the view content event fires
 */
export const pushProductToDataLayer = (product: ProductData) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    // Prevent duplicate events for the same product
    const eventKey = `product_view_${product.id}`;
    if (firedEvents.has(eventKey)) {
      console.log(
        "GTM: Product view event already fired for product:",
        product.id,
      );
      return;
    }

    const startTime = performance.now();

    try {
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
        product_code: product.productCode ? [product.productCode] : [],
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

      // Mark event as fired
      firedEvents.add(eventKey);

      const endTime = performance.now();
      console.log(
        `GTM: Product view event fired in ${(endTime - startTime).toFixed(2)}ms`,
        {
          productCode: product.productCode,
          id: product.id,
          name: product.title,
          price: product.discountedPrice ?? product.price,
          timestamp: new Date().toISOString(),
        },
      );
    } catch (error) {
      console.error("GTM: Error pushing product view event:", error);
    }
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
      product_code: product.productCode ? [product.productCode] : [],
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

/**
 * Push cart view event to GTM data layer
 * Use this when users view their cart
 */
export const pushCartViewToDataLayer = (cartData: CartData) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    // Clear previous ecommerce data
    window.dataLayer.push({ ecommerce: null });

    // Push cart data to data layer
    window.dataLayer.push({
      event: "cart_view",
      ecommerce: {
        currencyCode: "BDT",
        cart: {
          items: cartData.items.map((item) => ({
            name: item.name,
            id: item.id,
            price: item.discountedPrice ?? item.price,
            quantity: item.quantity,
            brand: item.brand ?? "Brand",
            category: item.category,
            sku: item.sku,
            productCode: item.productCode,
          })),
        },
      },
      // Additional custom dimensions for easy access
      cart_total: cartData.total,
      cart_currency: "BDT",
      cart_item_count: cartData.items.length,
      product_codes: cartData.items
        .map((item) => item.productCode)
        .filter(Boolean) as string[],
      product_skus: cartData.items
        .map((item) => item.sku)
        .filter(Boolean) as string[],
      product_names: cartData.items.map((item) => item.name),
      product_quantities: cartData.items.map((item) => item.quantity),
      product_prices: cartData.items.map(
        (item) => item.discountedPrice ?? item.price,
      ),
    });

    console.log("GTM: Cart data pushed to data layer:", {
      total: cartData.total,
      itemCount: cartData.items.length,
      productCodes: cartData.items
        .map((item) => item.productCode)
        .filter(Boolean),
    });
  }
};

/**
 * Push add to cart event to GTM data layer
 * Use this when users add products to cart
 */
export const pushAddToCartToDataLayer = (cartItem: CartItemData) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    // Clear previous ecommerce data
    window.dataLayer.push({ ecommerce: null });

    // Push add to cart data to data layer
    window.dataLayer.push({
      event: "add_to_cart",
      ecommerce: {
        currencyCode: "BDT",
        add: {
          products: [
            {
              name: cartItem.name,
              id: cartItem.id,
              price: cartItem.discountedPrice ?? cartItem.price,
              quantity: cartItem.quantity,
              brand: cartItem.brand ?? "Brand",
              category: cartItem.category,
              sku: cartItem.sku,
              productCode: cartItem.productCode,
            },
          ],
        },
      },
      // Additional custom dimensions for easy access
      product_id: cartItem.id,
      product_code: cartItem.productCode ? [cartItem.productCode] : [],
      product_sku: cartItem.sku,
      product_name: cartItem.name,
      product_price: cartItem.discountedPrice ?? cartItem.price,
      product_quantity: cartItem.quantity,
      product_currency: "BDT",
      product_brand: cartItem.brand,
      product_category: cartItem.category,
    });

    console.log("GTM: Add to cart data pushed to data layer:", {
      productCode: cartItem.productCode,
      id: cartItem.id,
      name: cartItem.name,
      quantity: cartItem.quantity,
      price: cartItem.discountedPrice ?? cartItem.price,
    });
  }
};

/**
 * Push purchase event to GTM data layer
 * Use this on the confirmation page after successful purchase
 */
export const pushPurchaseToDataLayer = (purchaseData: PurchaseData) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    // Clear previous ecommerce data
    window.dataLayer.push({ ecommerce: null });

    // Push purchase data to data layer
    window.dataLayer.push({
      event: "purchase",
      ecommerce: {
        currencyCode: "BDT",
        purchase: {
          transaction_id: purchaseData.orderId,
          value: purchaseData.total,
          products: purchaseData.products.map((product) => ({
            name: product.name,
            id: product.id,
            price: product.price,
            quantity: product.quantity,
            brand: product.brand ?? "Brand",
            category: product.category,
            sku: product.sku,
            productCode: product.productCode,
          })),
        },
      },
      // Additional custom dimensions for easy access
      transaction_id: purchaseData.orderId,
      transaction_total: purchaseData.total,
      transaction_currency: "BDT",
      product_codes: purchaseData.products
        .map((p) => p.productCode)
        .filter(Boolean) as string[],
      product_skus: purchaseData.products
        .map((p) => p.sku)
        .filter(Boolean) as string[],
      product_names: purchaseData.products.map((p) => p.name),
      product_quantities: purchaseData.products.map((p) => p.quantity),
    });

    console.log("GTM: Purchase data pushed to data layer:", {
      orderId: purchaseData.orderId,
      total: purchaseData.total,
      productCount: purchaseData.products.length,
      productCodes: purchaseData.products
        .map((p) => p.productCode)
        .filter(Boolean),
    });
  }
};

/**
 * Push wishlist event to GTM data layer
 * Use this when users add/remove products from wishlist
 */
export const pushWishlistToDataLayer = (
  product: ProductData,
  action: "add" | "remove",
) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    // Clear previous ecommerce data
    window.dataLayer.push({ ecommerce: null });

    // Push wishlist data to data layer
    window.dataLayer.push({
      event: action === "add" ? "add_to_wishlist" : "remove_from_wishlist",
      ecommerce: {
        currencyCode: "BDT",
        [action === "add" ? "add" : "remove"]: {
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
      product_code: product.productCode ? [product.productCode] : [],
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
      wishlist_action: action,
    });

    console.log(
      `GTM: ${action === "add" ? "Add to" : "Remove from"} wishlist data pushed to data layer:`,
      {
        productCode: product.productCode,
        id: product.id,
        name: product.title,
        action,
      },
    );
  }
};
