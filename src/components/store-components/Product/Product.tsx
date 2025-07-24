"use client";

import { useCartStore } from "@/context/store-context/CartContext";
import { useModalCartStore } from "@/context/store-context/ModalCartContext";
import { useModalQuickViewStore } from "@/context/store-context/ModalQuickViewContext";
import { useModalWishlistStore } from "@/context/store-context/ModalWishlistContext";
import { api } from "@/trpc/react";
import type { ProductType, ProductWithCategory } from "@/types/ProductType";
import { Eye, Heart, ShoppingBagOpen } from "@phosphor-icons/react/dist/ssr";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "../../../utils/format";

interface ProductProps {
  data: ProductType | ProductWithCategory;
  style?: string;
}

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

// Helper for stockStatus
const validStockStatuses = ["IN_STOCK", "OUT_OF_STOCK", "PRE_ORDER"] as const;
type StockStatus = (typeof validStockStatuses)[number];

// Helper type guard for Variant
function isVariant(v: unknown): v is Variant {
  return typeof v === "object" && v !== null;
}

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
    stockStatus: product.stockStatus as StockStatus,
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

type WishlistItem = {
  id: string;
  productId: string;
  userId: string;
  createdAt: Date;
  product: ProductWithCategory;
};

// Normalize variants field to always be Variant[] | null
function normalizeVariants(variants: unknown): Variant[] | null {
  if (Array.isArray(variants)) {
    return variants.filter(
      (v): v is Variant => typeof v === "object" && v !== null,
    );
  }
  if (typeof variants === "string") {
    try {
      const parsed: unknown = JSON.parse(variants);
      return Array.isArray(parsed)
        ? parsed.filter(
            (v): v is Variant => typeof v === "object" && v !== null,
          )
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

// Normalize a wishlist item from backend to expected frontend type
type BackendWishlistItem = Omit<WishlistItem, "product"> & {
  product: ProductWithCategory & { variants?: unknown };
};
function normalizeWishlistItem(item: BackendWishlistItem): WishlistItem {
  return {
    ...item,
    product: {
      ...item.product,
      variants: normalizeVariants(item.product.variants),
    },
  };
}

// Custom hook to detect mobile screen
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < breakpoint);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

export default function Product({ data }: ProductProps) {
  const { openModalCart } = useModalCartStore();
  const { openModalWishlist } = useModalWishlistStore();
  const { openQuickView } = useModalQuickViewStore();
  const { addToCart } = useCartStore();
  const { data: session } = useSession(); // Check if the user is logged in

  const utils = api.useUtils();

  const { data: wishlistRaw = [] } = api.wishList.getWishList.useQuery(
    undefined,
    {
      enabled: !!session?.user, // Only fetch wishlist if the user is logged in
    },
  );
  const wishlist: WishlistItem[] = Array.isArray(wishlistRaw)
    ? (wishlistRaw as BackendWishlistItem[]).map((item: BackendWishlistItem) =>
        normalizeWishlistItem(item),
      )
    : [];

  const addToWishlistMutation = api.wishList.addToWishList.useMutation({
    onMutate: async ({ productId: _productId }) => {
      // Cancel outgoing refetch to avoid overwriting optimistic update
      await utils.wishList.getWishList.cancel();

      // Get current wishlist data and normalize it
      const previousWishlistRaw = utils.wishList.getWishList.getData();
      const previousWishlist: WishlistItem[] = Array.isArray(
        previousWishlistRaw,
      )
        ? (previousWishlistRaw as BackendWishlistItem[]).map(
            (item: BackendWishlistItem) => normalizeWishlistItem(item),
          )
        : [];

      return { previousWishlist };
    },
    onError: (
      err: unknown,
      variables: unknown,
      context?: { previousWishlist?: WishlistItem[] },
    ) => {
      if (context?.previousWishlist) {
        utils.wishList.getWishList.setData(
          undefined,
          context.previousWishlist as unknown as Parameters<
            typeof utils.wishList.getWishList.setData
          >[1],
        );
      }
      if (err instanceof Error) {
        console.error(err.message);
      }
    },
    onSettled: async () => {
      // Sync with the server once mutation is settled (success or error)
      await utils.wishList.getWishList.invalidate();
    },
  });

  const removeFromWishlistMutation =
    api.wishList.removeFromWishList.useMutation({
      onMutate: async ({ productId: _productId }) => {
        await utils.wishList.getWishList.cancel();
        const previousWishlistRaw = utils.wishList.getWishList.getData();
        const previousWishlist: WishlistItem[] = Array.isArray(
          previousWishlistRaw,
        )
          ? (previousWishlistRaw as BackendWishlistItem[]).map(
              normalizeWishlistItem,
            )
          : [];

        // Optimistically update the wishlist by removing the item
        utils.wishList.getWishList.setData(undefined, ((
          old: WishlistItem[] | undefined,
        ) => {
          if (!old) return [];
          return old.filter((item: WishlistItem) => item.id !== _productId);
        }) as unknown as Parameters<
          typeof utils.wishList.getWishList.setData
        >[1]);

        return { previousWishlist };
      },
      onError: (
        err: unknown,
        variables: unknown,
        context?: { previousWishlist?: WishlistItem[] },
      ) => {
        if (context?.previousWishlist) {
          utils.wishList.getWishList.setData(
            undefined,
            context.previousWishlist as unknown as Parameters<
              typeof utils.wishList.getWishList.setData
            >[1],
          );
        }
        if (err instanceof Error) {
          console.error(err.message);
        }
      },
      onSettled: async () => {
        await utils.wishList.getWishList.invalidate();
      },
    });

  const isInWishlist = (itemId: string): boolean => {
    return wishlist.some(
      (item: WishlistItem) =>
        item.productId === itemId || item.product?.id === itemId,
    );
  };

  const handleAddToCart = () => {
    // Map Product to CartItem
    const cartItem = {
      id: data.id,
      productId: data.id,
      name:
        "title" in data && data.title
          ? data.title
          : "name" in data && data.name
            ? data.name
            : "",
      price: data.price,
      discountedPrice:
        "discountedPrice" in data
          ? (data.discountedPrice ?? undefined)
          : undefined,
      quantity: data.minQuantity ?? 1,
      coverImage:
        "images" in data && Array.isArray(data.images) && data.images[0]
          ? data.images[0]
          : "",
      sku: typeof data.sku === "string" ? data.sku : "",
      color: undefined,
      size: undefined,
      minQuantity: data.minQuantity ?? 1,
      maxQuantity: data.maxQuantity ?? undefined,
      quantityStep: data.quantityStep ?? 1,
    };
    addToCart(cartItem);
    openModalCart();
  };

  const handleAddToWishlist = () => {
    if (!session?.user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("pendingWishlistProductId", data.id);
        localStorage.setItem("openWishlistModalAfterLogin", "true");
      }
      openModalWishlist();
      return;
    }

    if (isInWishlist(data.id)) {
      removeFromWishlistMutation.mutate({ productId: data.id });
    } else {
      // Check for duplicates before adding
      if (!wishlist.some((item: WishlistItem) => item.id === data.id)) {
        addToWishlistMutation.mutate({ productId: data.id });
      }
    }

    openModalWishlist();
  };

  // Add this effect to handle pending wishlist after login
  useEffect(() => {
    if (session?.user && typeof window !== "undefined") {
      const pendingId = localStorage.getItem("pendingWishlistProductId");
      const shouldOpenModal = localStorage.getItem(
        "openWishlistModalAfterLogin",
      );
      if (pendingId) {
        if (!isInWishlist(pendingId)) {
          addToWishlistMutation.mutate({ productId: pendingId });
        }
        localStorage.removeItem("pendingWishlistProductId");
      }
      if (shouldOpenModal === "true") {
        openModalWishlist();
        localStorage.removeItem("openWishlistModalAfterLogin");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]);

  const handleQuickViewOpen = () => {
    // Type guard for ProductType | ProductWithCategory
    const getString = (field: keyof (ProductType | ProductWithCategory)) => {
      return typeof data[field] === "string" ? (data[field] as string) : "";
    };
    const getBoolean = (field: keyof (ProductType | ProductWithCategory)) => {
      return typeof data[field] === "boolean"
        ? (data[field] as boolean)
        : false;
    };
    const getNumber = (field: keyof (ProductType | ProductWithCategory)) => {
      return typeof data[field] === "number" ? (data[field] as number) : 0;
    };
    const productForQuickView: ProductType =
      "category" in data && typeof data.category === "object"
        ? toProductType(data as ProductWithCategory)
        : (data as ProductType);
    openQuickView(productForQuickView);
  };

  // Calculate discount percentage if discounted price is available
  const discountPercentage =
    data.discountedPrice != null
      ? Math.round(((data.price - data.discountedPrice) / data.price) * 100)
      : 0;

  // Calculate amount saved if discounted price is available
  const amountSaved =
    data.discountedPrice != null ? data.price - data.discountedPrice : 0;

  const isMobile = useIsMobile(); // 640px is Tailwind's 'sm' breakpoint

  return (
    <div className="product-item style-marketplace h-full min-h-[300px] rounded-[.25rem] border border-[#ddd] bg-white p-4 pt-5 transition-all duration-300 hover:shadow-md focus:border-[#ddd]">
      <div className="bg-img relative w-full pt-6">
        {/* Save badge with amount and percentage */}
        {discountPercentage > 0 && amountSaved > 0 && (
          <div
            className="marks"
            style={{
              fontFamily: '"Trebuchet MS", sans-serif',
              lineHeight: 1.15,
              fontSize: 14,
              position: "absolute",
              top: -12,
              left: -18,
              zIndex: 10,
            }}
          >
            {isMobile ? (
              <span
                className="mark"
                style={{
                  background: "var(--brand-primary)",
                  color: "#fff",
                  borderTopRightRadius: "10px",
                  borderBottomRightRadius: "10px",
                  padding: "0px 8px",
                  fontWeight: 700,
                  marginBottom: 2,
                  display: "inline-block",
                }}
              >
                -{discountPercentage}%
              </span>
            ) : (
              <span
                className="mark"
                style={{
                  background: "var(--brand-primary)",
                  color: "#fff",
                  borderTopRightRadius: "10px",
                  borderBottomRightRadius: "10px",
                  padding: "0px 8px",
                  fontWeight: 700,
                  marginBottom: 2,
                  display: "inline-block",
                }}
              >
                Save: {formatPrice(amountSaved, "৳")} (-{discountPercentage}%)
              </span>
            )}
          </div>
        )}

        <Link href={`/products/${data.slug}`}>
          <div className="relative overflow-hidden rounded-lg">
            <Image
              className="aspect-square w-full cursor-pointer object-cover transition-transform duration-300 hover:scale-105"
              width={5000}
              height={5000}
              src={
                typeof data === "object" &&
                "images" in data &&
                Array.isArray(data.images) &&
                typeof data.images[0] === "string" &&
                data.images[0]
                  ? data.images[0]
                  : "/images/products/1000x1000.png"
              }
              alt={
                "title" in data && typeof data.title === "string"
                  ? data.title
                  : "name" in data && typeof data.name === "string"
                    ? data.name
                    : ""
              }
            />
          </div>
        </Link>
        <div className="list-action absolute right-1 top-1 flex flex-col gap-2">
          <button
            className={`add-wishlistState-btn box-shadow-sm flex h-9 w-9 items-center justify-center rounded-full bg-white transition-all duration-300 hover:bg-gray-100 ${
              isInWishlist(data.id) ? "active bg-pink-50" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleAddToWishlist();
            }}
          >
            {isInWishlist(data.id) ? (
              <Heart
                size={18}
                weight="fill"
                className="cursor-pointer text-red-500"
              />
            ) : (
              <Heart size={18} className="cursor-pointer" />
            )}
            <div className="tag-action caption2 invisible absolute right-full mr-2 whitespace-nowrap rounded-sm bg-black px-1.5 py-0.5 text-white opacity-0 transition-opacity duration-300 hover:bg-black/75 group-hover:visible group-hover:opacity-100">
              {isInWishlist(data.id)
                ? "Remove from Wishlist"
                : "Add to Wishlist"}
            </div>
          </button>

          <button
            className="quick-view-btn box-shadow-sm flex h-9 w-9 items-center justify-center rounded-full bg-white transition-all duration-300 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickViewOpen();
            }}
          >
            <Eye size={18} />
            <div className="tag-action caption2 invisible absolute right-full mr-2 whitespace-nowrap rounded-sm bg-black px-1.5 py-0.5 text-white opacity-0 transition-opacity duration-300 hover:bg-black/75 group-hover:visible group-hover:opacity-100">
              Quick View
            </div>
          </button>
          <button
            className="add-cart-btn box-shadow-sm flex h-9 w-9 items-center justify-center rounded-full bg-white transition-all duration-300 hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
          >
            <ShoppingBagOpen size={18} />
            <div className="tag-action caption2 invisible absolute right-full mr-2 whitespace-nowrap rounded-sm bg-black px-1.5 py-0.5 text-white opacity-0 transition-opacity duration-300 hover:bg-black/75 group-hover:visible group-hover:opacity-100">
              Add To Cart
            </div>
          </button>
        </div>
      </div>
      <div className="product-info mt-4 flex flex-col">
        <Link href={`/products/${data.slug}`} className="flex-grow">
          <h3 className="text-title line-clamp-3 min-h-[4.5rem] cursor-pointer text-base font-medium hover:underline">
            {"title" in data && typeof data.title === "string"
              ? data.title
              : "name" in data && typeof data.name === "string"
                ? data.name
                : ""}
          </h3>
        </Link>

        <div className="mt-auto flex items-center">
          {"stockStatus" in data && data.stockStatus === "OUT_OF_STOCK" ? (
            <span className="font-bold text-red-500">Out Of Stock</span>
          ) : data.discountedPrice != null ? (
            <div className="flex items-center gap-2">
              <span className="text-title discounted-price font-bold">
                {formatPrice(data.discountedPrice, undefined)}
              </span>
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(data.price, undefined)}
              </span>
            </div>
          ) : (
            <span className="text-title font-bold">
              {formatPrice(data.price, undefined)}
            </span>
          )}
        </div>
        {/* Buy Now Button at the bottom */}
        {(!("stockStatus" in data) || data.stockStatus !== "OUT_OF_STOCK") && (
          <Link
            href={`/products/${data.slug}`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#f5f7ff] px-4 py-2 font-semibold text-[#2952e3] shadow-none transition-colors duration-200 hover:bg-[#e6eaff] focus:outline-none focus:ring-2 focus:ring-[#2952e3]/30 focus:ring-offset-2"
          >
            <ShoppingBagOpen size={20} className="text-[#2952e3]" />
            Buy Now
          </Link>
        )}
      </div>
    </div>
  );
}
