"use client";

import { useModalQuickViewStore } from "@/context/store-context/ModalQuickViewContext";
import { api } from "@/trpc/react";
import type { ProductType, ProductWithCategory } from "@/types/ProductType";
import { X } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "../../../utils/format";

// Local type for JSON value
type JsonValue =
  | string
  | number
  | boolean
  | { [x: string]: JsonValue }
  | Array<JsonValue>
  | null;
// Local type for Variant
type Variant = {
  [key: string]: string | number | string[] | undefined;
  colorName?: string;
  colorHex?: string;
  size?: string;
  images?: string[];
  price?: number;
  discountedPrice?: number;
  stock?: number;
  imageId?: string;
  sku?: string;
};

// Utility to convert ProductWithCategory to ProductType
function toProductType(product: ProductWithCategory): ProductType {
  // Normalize categoryAttributes to JsonValue
  let normalizedCategoryAttributes: JsonValue = null;
  if (
    product.categoryAttributes === null ||
    product.categoryAttributes === undefined
  ) {
    normalizedCategoryAttributes = null;
  } else if (typeof product.categoryAttributes === "string") {
    try {
      const parsed: unknown = JSON.parse(product.categoryAttributes);
      if (
        typeof parsed === "string" ||
        typeof parsed === "number" ||
        typeof parsed === "boolean" ||
        parsed === null ||
        Array.isArray(parsed) ||
        (typeof parsed === "object" && parsed !== null)
      ) {
        normalizedCategoryAttributes = parsed as JsonValue;
      } else {
        normalizedCategoryAttributes = null;
      }
    } catch {
      normalizedCategoryAttributes = null;
    }
  } else if (
    typeof product.categoryAttributes === "object" &&
    product.categoryAttributes !== null
  ) {
    try {
      const parsed: unknown = JSON.parse(
        JSON.stringify(product.categoryAttributes),
      );
      if (
        typeof parsed === "string" ||
        typeof parsed === "number" ||
        typeof parsed === "boolean" ||
        parsed === null ||
        Array.isArray(parsed) ||
        (typeof parsed === "object" && parsed !== null)
      ) {
        normalizedCategoryAttributes = parsed as JsonValue;
      } else {
        normalizedCategoryAttributes = null;
      }
    } catch {
      normalizedCategoryAttributes = null;
    }
  } else {
    normalizedCategoryAttributes = null;
  }

  // Normalize variants to Variant[] | null | undefined
  let normalizedVariants: Variant[] | null | undefined = undefined;
  if (Array.isArray(product.variants)) {
    normalizedVariants = product.variants.filter(isVariant);
  } else if (typeof product.variants === "string") {
    try {
      const parsed: unknown = JSON.parse(product.variants);
      normalizedVariants = Array.isArray(parsed)
        ? parsed.filter(isVariant)
        : null;
    } catch {
      normalizedVariants = null;
    }
  } else if (product.variants === null || product.variants === undefined) {
    normalizedVariants = null;
  } else {
    normalizedVariants = undefined;
  }

  return {
    id: product.id,
    title: product.title,
    featured: product.featured ?? false,
    shortDescription: product.shortDescription ?? "",
    published: product.published ?? false,
    discountedPrice: product.discountedPrice ?? null,
    stockStatus:
      product.stockStatus as import("@/types/ProductType").StockStatus,
    category: product.category?.name ?? "",
    name: product.title ?? "",
    new: product.new ?? false,
    sale: product.sale ?? false,
    rate: 0,
    price: product.price ?? 0,
    originPrice: product.price ?? 0,
    brand: product.brand ?? "",
    defaultColor: product.defaultColor ?? undefined,
    defaultColorHex: product.defaultColorHex ?? undefined,
    defaultSize: product.defaultSize ?? undefined,
    variantLabel: product.variantLabel ?? undefined,
    sold: 0,
    quantity: 0,
    quantityPurchase: 0,
    sizes: [],
    images: Array.isArray(product.images)
      ? product.images.filter((img): img is string => typeof img === "string")
      : [],
    description: product.description ?? null,
    action: "",
    slug: product.slug ?? "",
    attributes:
      typeof product.attributes === "object" &&
      product.attributes !== null &&
      !Array.isArray(product.attributes)
        ? (product.attributes as Record<string, string>)
        : {},
    variants: normalizedVariants,
    sku: product.sku ?? undefined,
    imageId: product.imageId ?? undefined,
    createdAt: product.createdAt ?? undefined,
    updatedAt: product.updatedAt ?? undefined,
    stock: product.stock ?? undefined,
    estimatedDeliveryTime: product.estimatedDeliveryTime ?? undefined,
    categoryId: product.categoryId ?? undefined,
    deletedAt: product.deletedAt ?? undefined,
    descriptionImageId: product.descriptionImageId ?? undefined,
    categoryAttributes: normalizedCategoryAttributes,
    position: product.position ?? undefined,
    minQuantity: product.minQuantity ?? 1,
    maxQuantity: product.maxQuantity ?? null,
    quantityStep: product.quantityStep ?? 1,
    quantityDiscounts: product.quantityDiscounts ?? [],
  };
}

// Helper type guard for Variant
function isVariant(v: unknown): v is Variant {
  return typeof v === "object" && v !== null;
}

const ModalNewsletter = () => {
  const [open, setOpen] = useState<boolean>(false);
  const router = useRouter();
  const { openQuickView } = useModalQuickViewStore();

  // Use correct type for productDataResult and productData
  const [productDataResult] = api.product.getAll.useSuspenseQuery() as [
    { products: ProductWithCategory[] } | undefined,
    unknown,
  ];
  const productData: { products: ProductWithCategory[] } =
    productDataResult && Array.isArray(productDataResult.products)
      ? productDataResult
      : { products: [] };

  const handleDetailProduct = (productId: string) => {
    // redirect to shop with category selected
    router.push(`/product/default?id=${productId}`);
  };

  useEffect(() => {
    setTimeout(() => {
      setOpen(true);
    }, 3000);
  }, []);

  return (
    <div className="modal-newsletter" onClick={() => setOpen(false)}>
      <div className="container flex h-full w-full items-center justify-center">
        <div
          className={`modal-newsletter-main ${open ? "open" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="main-content flex w-full overflow-hidden rounded-[20px]">
            <div className="left bg-green flex flex-col items-center justify-center gap-5 py-14 max-sm:hidden sm:w-2/5 lg:w-1/2">
              <div className="text-center text-xs font-semibold uppercase">
                Special Offer
              </div>
              <div className="text-center text-4xl font-bold uppercase leading-[42px] lg:text-[70px] lg:leading-[78px]">
                Black
                <br />
                Fridays
              </div>
              <div className="text-button-uppercase text-center">
                New customers save <span className="text-red-500">30%</span>
                with the code
              </div>
              <div className="text-button-uppercase rounded-lg bg-white px-4 py-2 text-red-500">
                GET20off
              </div>
              <div className="button-main w-fit bg-black uppercase text-white hover:bg-black/75 hover:bg-white">
                Copy coupon code
              </div>
            </div>
            <div className="right relative w-full bg-white max-sm:p-6 sm:w-3/5 sm:pl-10 sm:pt-10 lg:w-1/2">
              <div
                className="close-newsletter-btn absolute right-5 top-5 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#ddd] focus:border-[#ddd]"
                onClick={() => setOpen(false)}
              >
                <X weight="bold" className="text-xl" />
              </div>
              <div className="heading5 pb-5">You May Also Like</div>
              <div className="list flex flex-col gap-5 overflow-x-auto sm:pr-6">
                {Array.isArray(productData.products)
                  ? productData.products
                      .filter((item): item is ProductWithCategory => {
                        if (!item || typeof item !== "object") return false;
                        if (
                          !(
                            "id" in item &&
                            "title" in item &&
                            "images" in item &&
                            "price" in item &&
                            "discountedPrice" in item &&
                            "variants" in item
                          )
                        )
                          return false;
                        const variants = (item as { variants: unknown })
                          .variants;
                        return (
                          Array.isArray(variants) ||
                          typeof variants === "string" ||
                          variants === null
                        );
                      })
                      .slice(11, 16)
                      .map((product) => {
                        return (
                          <div
                            className="product-item item flex items-center justify-between gap-3 border-b border-[#ddd] pb-5 focus:border-[#ddd]"
                            key={product.id}
                          >
                            <div
                              className="infor flex cursor-pointer items-center gap-5"
                              onClick={() => handleDetailProduct(product.id)}
                            >
                              <div className="bg-img flex-shrink-0">
                                <Image
                                  width={5000}
                                  height={5000}
                                  src={
                                    product.images[0] ??
                                    "/images/product/1000x1000.png"
                                  }
                                  alt={product.title}
                                  className="aspect-square w-[100px] flex-shrink-0 rounded-lg"
                                />
                              </div>
                              <div className="">
                                <div className="name text-button">
                                  {product.title}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="product-price text-title">
                                    ৳{product.discountedPrice ?? product.price}
                                    .00
                                  </div>
                                  {product.discountedPrice && (
                                    <div className="product-origin-price text-title text-secondary2">
                                      <del>{formatPrice(product.price)}</del>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              className="quick-view-btn button-main hover:bg-green whitespace-nowrap rounded-full bg-black px-4 py-2 text-white hover:bg-black/75 sm:px-5 sm:py-3"
                              onClick={() =>
                                openQuickView(toProductType(product))
                              }
                            >
                              QUICK VIEW
                            </button>
                          </div>
                        );
                      })
                  : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalNewsletter;
