"use client";

import {
  trackAddToCart,
  trackViewContent,
} from "@/components/MetaPixelProvider";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/context/store-context/CartContext";
import { useModalCartStore } from "@/context/store-context/ModalCartContext";
import { useModalWishlistStore } from "@/context/store-context/ModalWishlistContext";
import { generateSKU } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { ProductWithCategory } from "@/types/ProductType";
import {
  CaretDown,
  DotsThree,
  HandsClapping,
  Heart,
  Minus,
  Plus,
  Question,
  Star,
  Timer,
  X,
} from "@phosphor-icons/react/dist/ssr";
import type { Product } from "@prisma/client";
import { addDays, format, formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { FaPinterestP, FaWhatsapp } from "react-icons/fa6";
import { toast } from "sonner";
import SwiperCore from "swiper/core";
import "swiper/css/bundle";
import { Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { v4 as uuid } from "uuid";
import { formatPrice } from "../../../../utils/format";
import ParseContent from "../../Blog/ParseContent";
import Rate from "../../Rate";
import RelatedProductsSidebar from "../RelatedProductsSidebar";

// Define a type for product variants
type ProductVariant = {
  colorName?: string;
  colorHex?: string;
  size?: string;
  price?: number;
  discountedPrice?: number;
  stock?: number;
  images?: string[];
};

// Add a type guard for discount objects
function isDiscountObject(
  d: unknown,
): d is { minQty: number; maxQty: number; discountPercent: number } {
  if (typeof d !== "object" || d === null) return false;
  const obj = d as Record<string, unknown>;
  return (
    typeof obj.minQty === "number" &&
    typeof obj.maxQty === "number" &&
    typeof obj.discountPercent === "number"
  );
}

// Normalize variants field to always be ProductVariant[] | null
function isProductVariant(v: unknown): v is ProductVariant {
  return typeof v === "object" && v !== null;
}
function normalizeVariants(variants: unknown): ProductVariant[] | null {
  if (Array.isArray(variants)) return variants.filter(isProductVariant);
  if (typeof variants === "string") {
    try {
      const parsed: unknown = JSON.parse(variants);
      if (Array.isArray(parsed)) return parsed.filter(isProductVariant);
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

// Utility to get category prefix (with mapping and fallback)
export function getCategoryPrefix(categoryName?: string) {
  if (!categoryName) return "XX";
  const mapping: Record<string, string> = {
    "Home Electrics": "HE",
    // Add more mappings as needed
  };
  if (categoryName in mapping) return mapping[categoryName];
  // Fallback: use first letter of each word, up to 3 letters
  return categoryName
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);
}

type WishlistItem = {
  id: string;
  productId: string;
  userId: string;
  createdAt: Date;
  product: Product;
};

// Helper to normalize quantityDiscounts to always be an array
function normalizeQuantityDiscounts(
  discounts: unknown,
): Array<{ minQty: number; maxQty: number; discountPercent: number }> {
  type Discount = { minQty: number; maxQty: number; discountPercent: number };
  function isDiscountObject(d: unknown): d is Discount {
    if (typeof d !== "object" || d === null) return false;
    const obj = d as Record<string, unknown>;
    return (
      typeof obj.minQty === "number" &&
      typeof obj.maxQty === "number" &&
      typeof obj.discountPercent === "number"
    );
  }
  if (Array.isArray(discounts)) {
    return discounts.filter(isDiscountObject).map((d) => ({
      minQty: d.minQty,
      maxQty: d.maxQty,
      discountPercent: d.discountPercent,
    }));
  }
  if (typeof discounts === "string") {
    try {
      const parsed: unknown = JSON.parse(discounts);
      if (Array.isArray(parsed)) {
        return parsed.filter(isDiscountObject).map((d) => ({
          minQty: d.minQty,
          maxQty: d.maxQty,
          discountPercent: d.discountPercent,
        }));
      }
    } catch {
      return [];
    }
  }
  return [];
}

export default function ProductDetails({
  productMain,
}: {
  productMain: ProductWithCategory;
}) {
  console.log("Product :", productMain);
  SwiperCore.use([Navigation, Thumbs]);
  const swiperRef = useRef<SwiperCore | null>(null);

  const { data: session } = useSession();

  const [openPopupImg, setOpenPopupImg] = useState(false);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperCore | null>(null);
  const [activeTab, setActiveTab] = useState<string | undefined>(
    "specifications",
  );
  const minQuantity = productMain.minQuantity ?? 1;
  const maxQuantity = productMain.maxQuantity;
  const quantityStep = productMain.quantityStep ?? 1;
  const [productQuantity, setProductQuantity] = useState<number | "">(
    minQuantity,
  );
  const [quantityError, setQuantityError] = useState<string>("");
  const [reviewForm, setReviewForm] = useState<{
    rating: number;
    comment: string;
  }>({ rating: 5, comment: "" });
  const [reviewSortOrder, setReviewSortOrder] = useState("newest");

  const { addToCart, updateCart, cartArray } = useCartStore();
  const { openModalCart } = useModalCartStore();
  const { openModalWishlist } = useModalWishlistStore();
  const utils = api.useUtils();

  const wishlistResponseRaw = api.wishList.getWishList.useSuspenseQuery()[0] as
    | BackendWishlistItem[]
    | undefined;
  const wishlistResponse = wishlistResponseRaw;
  const wishlist: WishlistItem[] = Array.isArray(wishlistResponse)
    ? wishlistResponse.map(normalizeWishlistItem)
    : [];

  const { data: reviews, refetch: refetchReviews } =
    api.review.getReviewsByProduct.useQuery(productMain.id, {
      initialData: [],
    });

  const { data: reviewStats } = api.review.getReviewStats.useQuery(
    productMain.id,
    {
      initialData: {
        totalCount: 0,
        averageRating: "0.0",
        ratingPercentages: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      },
    },
  );

  const { data: canReview, isLoading: canReviewLoading } =
    api.review.canReviewProduct.useQuery(productMain.id, {
      enabled: !!session,
    });

  // Track view content when component mounts
  useEffect(() => {
    trackViewContent(productMain);
  }, [productMain]);

  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSortOrder === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      // Parse the star rating from the sort order (e.g., "5star" -> 5)
      const targetRating = parseInt(reviewSortOrder.replace("star", ""));
      // First group by matching the target rating
      if (a.rating === targetRating && b.rating !== targetRating) return -1;
      if (a.rating !== targetRating && b.rating === targetRating) return 1;
      // Then sort by date within each group
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const addToWishlistMutation = api.wishList.addToWishList.useMutation({
    onSuccess: async () => {
      await utils.wishList.getWishList.invalidate();
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
  });

  const removeFromWishlistMutation =
    api.wishList.removeFromWishList.useMutation({
      onSuccess: async () => {
        await utils.wishList.getWishList.invalidate();
      },
    });

  const addReviewMutation = api.review.addReview.useMutation({
    onSuccess: async () => {
      toast.success("Review submitted successfully!");
      setReviewForm({ rating: 5, comment: "" });
      await utils.review.getReviewsByProduct.invalidate(productMain.id);
      await utils.review.getReviewStats.invalidate(productMain.id);
      void refetchReviews();
    },
    onError: (_error: unknown) => {
      const message =
        _error instanceof Error ? _error.message : "Error submitting review";
      toast.error(`Error submitting review: ${message}`);
    },
  });

  const handleSwiper = (swiper: SwiperCore) => {
    setThumbsSwiper(swiper);
  };

  const handleIncreaseQuantity = () => {
    if (typeof productQuantity !== "number") return;
    const next = productQuantity + quantityStep;
    if (maxQuantity !== null && maxQuantity !== undefined && next > maxQuantity)
      return setProductQuantity(maxQuantity);
    setProductQuantity(next);
  };

  const handleDecreaseQuantity = () => {
    if (typeof productQuantity !== "number") return;
    const next = productQuantity - quantityStep;
    return next < minQuantity
      ? setProductQuantity(minQuantity)
      : setProductQuantity(next);
  };

  const validateQuantity = (qty: number | "") => {
    if (qty === "" || isNaN(Number(qty))) {
      return "Please enter a quantity.";
    }
    if (typeof qty === "number") {
      if (qty < minQuantity) {
        return `Minimum quantity is ${minQuantity}.`;
      }
      if (
        maxQuantity !== undefined &&
        maxQuantity !== null &&
        qty > maxQuantity
      ) {
        return `Maximum quantity is ${maxQuantity}.`;
      }
    }
    return "";
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setProductQuantity("");
      setQuantityError("Please enter a quantity.");
      return;
    }
    const num = Number(val);
    setProductQuantity(num);
    setQuantityError(validateQuantity(num));
  };

  const handleQuantityBlur = () => {
    setQuantityError(validateQuantity(productQuantity));
  };

  // Fetch category hierarchy for primary category name
  const { data: categoryHierarchy } = api.category.getHierarchy.useQuery(
    productMain.category?.id
      ? { id: productMain.category.id }
      : productMain.categoryId
        ? { id: productMain.categoryId }
        : { id: "" },
    { enabled: Boolean(productMain.category?.id ?? productMain.categoryId) },
  );

  const handleAddToCart = () => {
    const error = validateQuantity(productQuantity);
    setQuantityError(error);
    if (error || typeof productQuantity !== "number") return;
    // Debug log for color/size selection and cart item
    const primaryCategoryName = categoryHierarchy?.[0]?.name ?? "XX";
    // --- Calculate correct discounted price based on quantityDiscounts ---
    const qty = productQuantity;
    const baseUnitPrice =
      typeof activeVariant?.discountedPrice === "number"
        ? activeVariant.discountedPrice
        : typeof productMain.discountedPrice === "number"
          ? productMain.discountedPrice
          : typeof activeVariant?.price === "number"
            ? activeVariant.price
            : productMain.price;
    const discountsArr = normalizeQuantityDiscounts(
      productMain.quantityDiscounts,
    );
    const unit = getDiscountedUnitPrice(qty, baseUnitPrice, discountsArr);
    const discountPercent = (() => {
      if (!discountsArr.length) return 0;
      // Sort discounts by minQty to ensure we find the highest applicable tier
      const sortedDiscounts = [...discountsArr].sort(
        (a, b) => a.minQty - b.minQty,
      );
      // Find the highest tier where quantity >= minQty
      const applicableDiscount = sortedDiscounts
        .filter((d) => qty >= d.minQty)
        .pop(); // Get the highest tier that applies
      return applicableDiscount ? applicableDiscount.discountPercent : 0;
    })();
    const cartItem = {
      id: displaySKU, // Use SKU as unique cart item id
      name: productMain.title,
      price:
        typeof activeVariant?.price === "number"
          ? activeVariant.price
          : (productMain.discountedPrice ?? productMain.price),
      discountedPrice: unit, // <-- use the calculated unit price
      quantity: productQuantity,
      coverImage:
        activeVariant?.images?.[0] ??
        productMain.images?.[0] ??
        "/images/product/1000x1000.png",
      sku: displaySKU,
      color: selectedColorHex, // for swatch
      colorName: selectedColorName, // for display
      size: selectedSize,
      productId: productMain.id,
      minQuantity: productMain.minQuantity ?? 1,
      maxQuantity: productMain.maxQuantity ?? undefined,
      quantityStep: productMain.quantityStep ?? 1,
      variantLabel: productMain.variantLabel, // <-- added
      discountPercent, // <-- add this for modal cart display
    };
    console.log(
      "[AddToCart] selectedColorHex:",
      selectedColorHex,
      "selectedColorName:",
      selectedColorName,
      "selectedSize:",
      selectedSize,
      "cartItem:",
      cartItem,
    );
    // Add to cart (allow multiple variants)
    if (!cartArray.find((item) => item.id === cartItem.id)) {
      addToCart(cartItem);
      updateCart(cartItem.id, productQuantity);
    } else {
      updateCart(cartItem.id, productQuantity);
    }

    // Track add to cart event
    trackAddToCart(productMain);

    openModalCart();
  };

  const isInWishlist = (itemId: string): boolean => {
    return wishlist.some((item: WishlistItem) => item.productId === itemId);
  };

  const handleAddToWishlist = () => {
    if (isInWishlist(productMain.id)) {
      // **Optimistic UI Update: Remove item immediately**
      utils.wishList.getWishList.setData(undefined, ((
        old: WishlistItem[] | undefined,
      ) => {
        if (!old) return [];
        return old.filter((item) => item.product.id !== productMain.id);
      }) as unknown as Parameters<
        typeof utils.wishList.getWishList.setData
      >[1]);

      removeFromWishlistMutation.mutate(
        { productId: productMain.id },
        {
          onError: (_error: unknown) => {
            // **Rollback on failure**
            void utils.wishList.getWishList.invalidate();
          },
        },
      );
    } else {
      // **Optimistic UI Update: Add item immediately**
      utils.wishList.getWishList.setData(undefined, ((
        old: WishlistItem[] | undefined,
      ) => [
        ...(old ?? []),
        normalizeWishlistItem({
          id: uuid(),
          product: productMain as ProductWithCategory & { variants?: unknown },
          createdAt: new Date(),
          userId: session?.user.id ?? "temp-user",
          productId: productMain.id,
        }),
      ]) as unknown as Parameters<
        typeof utils.wishList.getWishList.setData
      >[1]);

      addToWishlistMutation.mutate(
        { productId: productMain.id },
        {
          onError: (_error: unknown) => {
            // **Rollback on failure**
            void utils.wishList.getWishList.invalidate();
          },
        },
      );
    }

    openModalWishlist();
  };

  const handleActiveTab = (tab: string) => {
    setActiveTab(tab);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error("Please sign in to submit a review");
      return;
    }

    addReviewMutation.mutate({
      productId: productMain.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    });
  };

  const handleReviewSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReviewSortOrder(e.target.value);
  };

  // Calculate estimated delivery date based on the product's estimatedDeliveryTime
  const calculateEstimatedDeliveryDate = () => {
    if (!productMain.estimatedDeliveryTime) {
      return "Not available";
    }
    const today = new Date();
    const deliveryDate = addDays(today, productMain.estimatedDeliveryTime);
    return format(deliveryDate, "dd MMMM");
  };

  const router = useRouter();

  const handleBuyNow = () => {
    const error = validateQuantity(productQuantity);
    setQuantityError(error);
    if (error || typeof productQuantity !== "number") return;
    // Determine if a variant is selected
    const isVariantSelected = !!(selectedColorHex && selectedSize);
    // Build buy-now product object
    const buyNowProduct = {
      id: isVariantSelected
        ? `${productMain.id}-${selectedColorHex}-${selectedSize}`
        : productMain.id,
      name: productMain.title,
      price:
        typeof activeVariant?.price === "number"
          ? activeVariant.price
          : (productMain.discountedPrice ?? productMain.price),
      discountedPrice:
        typeof activeVariant?.discountedPrice === "number"
          ? activeVariant.discountedPrice
          : typeof productMain.discountedPrice === "number"
            ? productMain.discountedPrice
            : undefined,
      quantity: productQuantity,
      coverImage:
        activeVariant?.images?.[0] ??
        productMain.images?.[0] ??
        "/images/product/1000x1000.png",
      sku: generateSKU({
        categoryName: categoryHierarchy?.[0]?.name ?? "XX",
        productId: productMain.id,
        color: selectedColorName,
        size: selectedSize,
      }),
      color: selectedColorHex, // for swatch
      colorName: selectedColorName, // for display
      size: selectedSize,
      productId: productMain.id,
      minQuantity: productMain.minQuantity ?? 1,
      maxQuantity: productMain.maxQuantity ?? undefined,
      quantityStep: productMain.quantityStep ?? 1,
      variantLabel: productMain.variantLabel, // <-- added
    };
    // Store in sessionStorage for checkout page
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        "buyNowProduct",
        JSON.stringify(buyNowProduct),
      );
    }
    // Redirect to checkout
    router.push("/checkout");
  };

  // Q&A Section
  const {
    data: questions,
    isLoading,
    refetch,
  } = api.question.getQuestionsByProduct.useQuery(productMain.id);
  const askQuestionMutation = api.question.askQuestion.useMutation();
  const [questionText, setQuestionText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!session?.user) {
      toast.error("Please sign in to ask a question");
      return;
    }
    if (questionText.trim().length < 5) {
      setError("Question must be at least 5 characters long.");
      return;
    }
    try {
      await askQuestionMutation.mutateAsync({
        productId: productMain.id,
        question: questionText.trim(),
      });
      toast.success("Your question has been submitted!");
      setQuestionText("");
      await refetch();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to submit question";
      toast.error(message);
    }
  };

  // Normalize variants field (handle string or array)
  let variants: ProductVariant[] = [];
  if (typeof productMain.variants === "string") {
    try {
      variants = JSON.parse(productMain.variants) as ProductVariant[];
    } catch {
      variants = [];
    }
  } else if (Array.isArray(productMain.variants)) {
    variants = productMain.variants as ProductVariant[];
  }

  // Variant selection state
  const [selectedColorHex, setSelectedColorHex] = useState<string | undefined>(
    productMain.defaultColorHex ?? productMain.defaultColor ?? undefined,
  );
  const [selectedColorName, setSelectedColorName] = useState<
    string | undefined
  >(productMain.defaultColor ?? undefined);
  // Initialize selected size with default size if available
  const [selectedSize, setSelectedSize] = useState<string | undefined>(() => {
    // If there's a default size, use it
    if (productMain.defaultSize) {
      return productMain.defaultSize;
    }
    // Otherwise, if there are variants with sizes, use the first available size
    if (variants && variants.length > 0) {
      const firstVariantWithSize = variants.find((v) => v.size);
      return firstVariantWithSize?.size;
    }
    return undefined;
  });

  // Reset and auto-select size when color changes
  useEffect(() => {
    if (selectedColorHex) {
      const availableSizesForColor =
        getAvailableSizesForColor(selectedColorHex);
      // If current selected size is not available for the new color, select the first available size
      if (selectedSize && !availableSizesForColor.includes(selectedSize)) {
        setSelectedSize(availableSizesForColor[0] ?? undefined);
      }
      // If no size is selected but sizes are available, select the first one
      else if (!selectedSize && availableSizesForColor.length > 0) {
        setSelectedSize(availableSizesForColor[0]);
      }
    }
  }, [selectedColorHex, selectedSize]);

  // Initialize with default size when component mounts
  useEffect(() => {
    if (!selectedSize && productMain.defaultSize) {
      setSelectedSize(productMain.defaultSize);
    }
  }, [selectedSize, productMain.defaultSize]);

  // Show default color swatch and name
  const defaultColorHex =
    productMain.defaultColorHex ?? productMain.defaultColor ?? undefined;
  const defaultColorName =
    productMain.defaultColor ?? productMain.defaultColorHex ?? undefined;

  // Helper function to normalize color values for comparison
  const normalizeColor = (color: string) => color.toLowerCase().trim();

  // Normalize and get available colors from variants
  const variantColors = variants
    ? variants
        .map((v) => ({
          colorHex: v.colorHex ?? v.colorName ?? "#ffffff",
          colorName: v.colorName ?? v.colorHex ?? "Unnamed",
        }))
        .filter((v) => v.colorHex && v.colorName)
    : [];

  // Build a unified color list: combine default color and variant colors without duplicates
  const unifiedColors: { colorHex: string; colorName: string }[] = [];

  // Create a map to track unique colors by both hex and name
  const colorMap = new Map<string, string>();

  // Add default color first (if it exists)
  if (defaultColorHex) {
    const normalizedDefaultColor = normalizeColor(defaultColorHex);
    colorMap.set(normalizedDefaultColor, defaultColorName ?? defaultColorHex);
  }

  // Add variant colors, checking for duplicates by normalized color values
  variantColors.forEach((colorObj) => {
    const normalizedColorHex = normalizeColor(colorObj.colorHex);
    const normalizedColorName = normalizeColor(colorObj.colorName);

    // Check if this color already exists (by hex or name)
    let colorExists = false;
    colorMap.forEach((existingName, existingHex) => {
      if (
        normalizeColor(existingHex) === normalizedColorHex ||
        normalizeColor(existingName) === normalizedColorName
      ) {
        colorExists = true;
      }
    });

    // Only add if it doesn't exist
    if (!colorExists) {
      colorMap.set(normalizedColorHex, colorObj.colorName);
    }
  });

  // Convert map to array
  colorMap.forEach((colorName, colorHex) => {
    unifiedColors.push({
      colorHex,
      colorName,
    });
  });

  // Helper to convert color names to hex for common colors
  const colorNameToHex: Record<string, string> = {
    white: "#ffffff",
    black: "#000000",
    red: "#ff0000",
    blue: "#0000ff",
    green: "#008000",
    yellow: "#ffff00",
    // ...add more as needed
  };
  function normalizeColorValue(color: string) {
    if (!color) return "";
    const c = color.trim().toLowerCase();
    // If it's a hex, return as is
    if (c.startsWith("#")) return c;
    // If it's a name, convert to hex if possible
    return colorNameToHex[c] ?? c;
  }

  // Get available sizes based on selected color
  const getAvailableSizesForColor = (colorHex?: string) => {
    const sizes: string[] = [];
    if (!colorHex) {
      // No color selected: show all sizes
      if (productMain.defaultSize) sizes.push(productMain.defaultSize);
      if (variants) {
        variants.forEach((v) => {
          if (v.size) sizes.push(v.size);
        });
      }
    } else {
      const selectedNorm = normalizeColorValue(colorHex);
      // Default product
      if (
        productMain.defaultSize &&
        (normalizeColorValue(defaultColorHex ?? "") === selectedNorm ||
          normalizeColorValue(defaultColorName ?? "") === selectedNorm)
      ) {
        sizes.push(productMain.defaultSize);
      }
      // Variants
      if (variants) {
        variants.forEach((v) => {
          const vColorHex = normalizeColorValue(v.colorHex ?? "");
          const vColorName = normalizeColorValue(v.colorName ?? "");
          if (
            (vColorHex && vColorHex === selectedNorm) ||
            (vColorName && vColorName === selectedNorm)
          ) {
            if (v.size) sizes.push(v.size);
          }
        });
      }
    }
    return [...new Set(sizes)];
  };

  const availableSizes = getAvailableSizesForColor(selectedColorHex);

  // Find the most specific variant (for now, only by color and size, using robust normalization)
  let activeVariant: ProductVariant | undefined = undefined;
  if (selectedColorHex && selectedSize) {
    const selectedNorm = normalizeColorValue(selectedColorHex);
    activeVariant = variants.find((v) => {
      const vColorHex = normalizeColorValue(v.colorHex ?? "");
      const vColorName = normalizeColorValue(v.colorName ?? "");
      return (
        (vColorHex === selectedNorm || vColorName === selectedNorm) &&
        v.size === selectedSize
      );
    });
  } else if (selectedColorHex) {
    const selectedNorm = normalizeColorValue(selectedColorHex);
    activeVariant = variants.find((v) => {
      const vColorHex = normalizeColorValue(v.colorHex ?? "");
      const vColorName = normalizeColorValue(v.colorName ?? "");
      return vColorHex === selectedNorm || vColorName === selectedNorm;
    });
  } else if (selectedSize) {
    activeVariant = variants.find((v) => v.size === selectedSize);
  }
  console.log("Active Variant:", activeVariant);

  const displayImages = activeVariant?.images?.length
    ? activeVariant.images
    : productMain.images;
  const displayPrice =
    typeof activeVariant?.price === "number"
      ? activeVariant.price
      : (productMain.discountedPrice ?? productMain.price);
  const displayDiscountedPrice =
    typeof activeVariant?.discountedPrice === "number"
      ? activeVariant.discountedPrice
      : productMain.discountedPrice;
  const displayStock =
    typeof activeVariant?.stock === "number"
      ? activeVariant.stock
      : productMain.stock;
  console.log(productMain.defaultColor);

  // Generate SKU for display
  const displaySKU = generateSKU({
    categoryName: categoryHierarchy?.[0]?.name ?? "XX",
    productId: productMain.id,
    color: selectedColorName ?? "UNNAMED",
    size: selectedSize,
  });

  const [shouldScrollToQuestion, setShouldScrollToQuestion] = useState(false);

  useEffect(() => {
    if (activeTab === "questions" && shouldScrollToQuestion) {
      const el = document.getElementById("ask-question-form");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setShouldScrollToQuestion(false);
      }
    }
  }, [activeTab, shouldScrollToQuestion]);

  // Add this inside the ProductDetails component
  const [currentUrl, setCurrentUrl] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  // Helper to get the correct unit price based on quantity and discount ranges
  function getDiscountedUnitPrice(
    quantity: number,
    basePrice: number,
    discounts?:
      | Array<{
          minQty: number;
          maxQty: number;
          discountPercent: number;
        }>
      | string
      | null,
  ) {
    let normalized: Array<{
      minQty: number;
      maxQty: number;
      discountPercent: number;
    }> = [];
    if (Array.isArray(discounts)) {
      normalized = discounts as Array<{
        minQty: number;
        maxQty: number;
        discountPercent: number;
      }>;
    } else if (typeof discounts === "string") {
      try {
        const parsed: unknown = JSON.parse(discounts);
        if (Array.isArray(parsed) && parsed.every(isDiscountObject)) {
          normalized = parsed as Array<{
            minQty: number;
            maxQty: number;
            discountPercent: number;
          }>;
        }
      } catch {
        // ignore
      }
    }
    if (normalized.length === 0) return basePrice;

    // Sort discounts by minQty to ensure we find the highest applicable tier
    const sortedDiscounts = [...normalized].sort((a, b) => a.minQty - b.minQty);

    // Find the highest tier where quantity >= minQty
    // This handles quantities above maxQty by applying the highest tier discount
    const applicableDiscount = sortedDiscounts
      .filter((d) => quantity >= d.minQty)
      .pop(); // Get the highest tier that applies

    if (applicableDiscount) {
      return basePrice - (basePrice * applicableDiscount.discountPercent) / 100;
    }
    return basePrice;
  }

  return (
    <>
      <div className="product-detail sale mb-5">
        {/* Social Share Row with border, rounded, and shadow */}
        <div className="mb-4 flex items-center justify-between px-4 pt-4 md:px-4">
          <div className="w-full">
            <div className="flex flex-row items-center justify-between gap-3 rounded-full border bg-white px-6 py-3 shadow md:flex-row md:gap-0 md:px-6 md:py-2">
              <div className="flex items-center justify-center gap-2">
                <span className="font-semibold text-gray-700">Share:</span>
                {/* Messenger (commented out) */}
                {/* <a
                  href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101828] text-white hover:opacity-80"
                  title="Share on Messenger"
                  aria-disabled={!currentUrl}
                  tabIndex={!currentUrl ? -1 : 0}
                >
                  <FaFacebookMessenger size={18} />
                </a> */}
                {/* Pinterest */}
                <a
                  href={
                    currentUrl
                      ? `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(currentUrl)}`
                      : undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101828] text-white hover:opacity-80"
                  title="Share on Pinterest"
                  aria-disabled={!currentUrl}
                  tabIndex={!currentUrl ? -1 : 0}
                >
                  <FaPinterestP size={18} />
                </a>
                {/* WhatsApp */}
                <a
                  href={
                    currentUrl
                      ? `https://api.whatsapp.com/send?text=${encodeURIComponent(currentUrl)}`
                      : undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101828] text-white hover:opacity-80"
                  title="Share on WhatsApp"
                  aria-disabled={!currentUrl}
                  tabIndex={!currentUrl ? -1 : 0}
                >
                  <FaWhatsapp size={18} />
                </a>
              </div>
              {/* Wishlist and Cart Buttons */}
              <div className="flex flex-row items-center gap-2 md:flex-row md:items-center md:gap-2">
                <button
                  className={`flex items-center gap-1 rounded-lg border px-3 py-1 text-sm font-semibold ${isInWishlist(productMain.id) ? "border-black bg-black text-white" : "border-[#ddd] bg-white text-black hover:border-black hover:bg-black hover:text-white"}`}
                  onClick={handleAddToWishlist}
                >
                  <Heart
                    size={18}
                    weight={isInWishlist(productMain.id) ? "fill" : "regular"}
                  />
                  {isInWishlist(productMain.id) ? "Wishlisted" : "Wishlist"}
                </button>
                <button
                  className="flex items-center gap-1 rounded-lg border border-black bg-white px-3 py-1 text-sm font-semibold text-black hover:bg-black hover:text-white"
                  onClick={handleAddToCart}
                >
                  <Plus size={18} /> Cart
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="featured-product underwear bg-white py-10 md:py-20">
          <div className="container flex flex-col gap-y-6 lg:flex-row lg:items-start lg:gap-x-8">
            <div className="list-img w-full lg:w-1/2 lg:pr-[45px]">
              {/* Images Swiper */}
              <Swiper
                slidesPerView={1}
                spaceBetween={0}
                thumbs={{ swiper: thumbsSwiper }}
                modules={[Thumbs, Navigation]}
                navigation={true}
                className="mySwiper2 overflow-hidden rounded-2xl"
              >
                {displayImages.map((item, index) => (
                  <SwiperSlide
                    key={index}
                    onClick={() => {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                      swiperRef.current?.slideTo(index);
                      setOpenPopupImg(true);
                    }}
                  >
                    <Image
                      src={item}
                      width={1000}
                      height={1000}
                      alt="prd-img"
                      className="w-full"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
              <Swiper
                onSwiper={handleSwiper}
                spaceBetween={0}
                slidesPerView={4}
                freeMode={true}
                watchSlidesProgress={true}
                modules={[Navigation, Thumbs]}
                // navigation={true}
                className="mySwiper style-rectangle"
              >
                {displayImages.map((item, index) => (
                  <SwiperSlide key={index}>
                    <Image
                      src={item}
                      width={1000}
                      height={1300}
                      alt="prd-img"
                      className="w-full rounded-xl object-contain"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
              <div className={`popup-img ${openPopupImg ? "open" : ""}`}>
                <span
                  className="close-popup-btn absolute right-4 top-4 z-[2] cursor-pointer"
                  onClick={() => {
                    setOpenPopupImg(false);
                  }}
                >
                  <X className="text-3xl text-white" />
                </span>
                <Swiper
                  spaceBetween={0}
                  slidesPerView={1}
                  modules={[Navigation, Thumbs]}
                  navigation={true}
                  loop={true}
                  className="popupSwiper"
                  onSwiper={(swiper) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    swiperRef.current = swiper;
                  }}
                >
                  {displayImages.map((item, index) => (
                    <SwiperSlide
                      key={index}
                      onClick={() => {
                        setOpenPopupImg(false);
                      }}
                    >
                      <Image
                        src={item}
                        width={1000}
                        height={1000}
                        alt="prd-img"
                        className="w-full rounded-xl object-contain"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent
                        }}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>
            <div className="product-infor w-full lg:w-1/2 lg:pl-[15px]">
              <div className="flex justify-between">
                <div>
                  <h1 className="mt-1 text-[30px] font-semibold capitalize leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
                    {productMain.title}
                  </h1>
                </div>
              </div>
              <div className="mt-3 flex items-center">
                <Rate
                  currentRate={parseFloat(reviewStats.averageRating)}
                  size={14}
                />
                <span className="text-base font-normal text-secondary md:text-[13px] md:leading-5">
                  ({reviewStats.totalCount}{" "}
                  {reviewStats.totalCount === 1 ? "review" : "reviews"})
                </span>
              </div>
              {/* Unified Color Selector */}
              {unifiedColors.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 font-semibold">Color:</span>
                    <div className="flex flex-wrap gap-x-2 gap-y-2 py-1">
                      {unifiedColors.map((colorObj, idx) => (
                        <div
                          key={String(colorObj.colorHex) + idx}
                          className="mx-1 flex flex-shrink-0 flex-col items-center"
                        >
                          <button
                            className={`rounded-full border p-0 ${selectedColorHex === colorObj.colorHex ? "border-2 border-blue-500 ring-2 ring-blue-400" : "border"}`}
                            style={{
                              width: 28,
                              height: 28,
                              backgroundColor: colorObj.colorHex,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            onClick={() => {
                              setSelectedColorHex(colorObj.colorHex);
                              setSelectedColorName(colorObj.colorName);
                            }}
                            aria-label={colorObj.colorName}
                            title={colorObj.colorName}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 20,
                                height: 20,
                                backgroundColor: colorObj.colorHex,
                                borderRadius: "50%",
                                // border: "1px solid #ccc",
                              }}
                            />
                          </button>
                          <span
                            className="mt-1 text-center text-xs"
                            style={{ maxWidth: 48, wordBreak: "break-word" }}
                          >
                            {colorObj.colorName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {/* Size selector (always show if availableSizes.length > 0) */}
              {availableSizes.length > 0 && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex-shrink-0 font-semibold">
                    {productMain.variantLabel || "Size"}:
                  </span>
                  <div className="flex flex-wrap gap-x-2 gap-y-2 py-1">
                    {availableSizes.map((size, idx) =>
                      size ? (
                        <button
                          key={size + idx}
                          className={`flex-shrink-0 rounded border px-3 py-1 ${selectedSize === size ? "border-2 border-blue-500 bg-black text-white" : "bg-white text-black"}`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ) : null,
                    )}
                  </div>
                </div>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {displayStock === 0 ? (
                  <div className="product-price heading5 font-bold text-red-500">
                    Out Of Stock
                  </div>
                ) : displayDiscountedPrice &&
                  displayDiscountedPrice < displayPrice ? (
                  <>
                    <div className="product-price heading5 discounted-price">
                      {formatPrice(displayDiscountedPrice)}
                      {productMain.perUnitText && (
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          {productMain.perUnitText}
                        </span>
                      )}
                    </div>
                    <div className="bg-line h-4 w-px"></div>
                    <div className="product-origin-price text-secondary2 font-normal">
                      <del>{formatPrice(displayPrice)}</del>
                    </div>
                  </>
                ) : (
                  <div className="product-price heading5">
                    {formatPrice(displayPrice)}
                    {productMain.perUnitText && (
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        {productMain.perUnitText}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div
                className="desc mt-5 block border-b border-[#ddd] pb-6 text-base text-secondary focus:border-[#ddd] lg:text-lg"
                style={{ whiteSpace: "pre-line" }}
              >
                {productMain.shortDescription}
              </div>

              <div className="list-action mt-6">
                {/* Quantity Discount Table (Bulk Order Discounts) */}
                {normalizeQuantityDiscounts(productMain.quantityDiscounts)
                  .length > 0 && (
                  <div className="my-4">
                    <h4 className="mb-2 text-base font-semibold">
                      Bulk Order Discounts
                    </h4>
                    <table className="min-w-full rounded border border-gray-200 text-sm">
                      <thead>
                        <tr>
                          <th className="px-2 py-1 text-left">Min Qty</th>
                          <th className="px-2 py-1 text-left">Max Qty</th>
                          <th className="px-2 py-1 text-left">Discount %</th>
                          <th className="px-2 py-1 text-left">Unit Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {normalizeQuantityDiscounts(
                          productMain.quantityDiscounts,
                        ).map((row, idx) => {
                          // Calculate the discounted unit price for the minQty in this range
                          const baseUnitPrice =
                            typeof activeVariant?.discountedPrice === "number"
                              ? activeVariant.discountedPrice
                              : typeof productMain.discountedPrice === "number"
                                ? productMain.discountedPrice
                                : typeof activeVariant?.price === "number"
                                  ? activeVariant.price
                                  : productMain.price;
                          const unit = getDiscountedUnitPrice(
                            row.minQty,
                            baseUnitPrice,
                            productMain.quantityDiscounts,
                          );
                          return (
                            <tr key={idx} className="border-t border-gray-100">
                              <td className="px-2 py-1">{row.minQty}</td>
                              <td className="px-2 py-1">{row.maxQty}</td>
                              <td className="px-2 py-1">
                                {row.discountPercent}%
                              </td>
                              <td className="px-2 py-1">{formatPrice(unit)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="mt-1 text-xs text-gray-500">
                      * Discount applies automatically when you order within the
                      specified quantity range. Quantities above the maximum
                      range will receive the highest tier discount.
                    </div>
                  </div>
                )}

                <div className="text-title mt-5">Quantity:</div>
                <div className="choose-quantity mt-3 flex items-center gap-5 gap-y-3 lg:justify-between">
                  <div className="quantity-block flex w-[180px] flex-shrink-0 items-center justify-between rounded-lg border border-[#ddd] bg-white focus:border-[#ddd] max-md:px-3 max-md:py-1.5 sm:w-[220px] md:p-3">
                    <Minus
                      size={20}
                      onClick={handleDecreaseQuantity}
                      className={`${productQuantity === minQuantity ? "disabled" : ""} cursor-pointer`}
                    />
                    <input
                      type="text"
                      className="quantity-input body1 border-none bg-transparent text-center font-semibold outline-none"
                      min={minQuantity}
                      max={maxQuantity ?? undefined}
                      step={quantityStep}
                      value={productQuantity}
                      onChange={handleQuantityChange}
                      onBlur={handleQuantityBlur}
                      style={{
                        width: "80px",
                        padding: "2px 4px",
                        fontSize: "1.1rem",
                        margin: 0,
                        fontFamily: "monospace",
                      }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    {/* {quantityError && (
                      <div className="mt-1 w-full text-center text-xs text-red-500">
                        {quantityError}
                      </div>
                    )} */}
                    <Plus
                      size={20}
                      onClick={handleIncreaseQuantity}
                      className="cursor-pointer"
                    />
                  </div>

                  <div
                    onClick={handleAddToCart}
                    className={`duration-400 md:text-md inline-block w-full rounded-[.25rem] border border-black bg-white px-0 py-4 text-center text-sm font-semibold uppercase leading-5 text-black transition-all ease-in-out hover:bg-black hover:bg-black/75 hover:text-white md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4 ${quantityError ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    style={quantityError ? { pointerEvents: "none" } : {}}
                  >
                    Add To Cart
                  </div>
                </div>
                {/* Total Price Display */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-semibold">Total Price</span>
                  <span className="text-lg font-bold">
                    {(() => {
                      const qty =
                        typeof productQuantity === "number"
                          ? productQuantity
                          : 0;
                      const baseUnitPrice =
                        typeof activeVariant?.discountedPrice === "number"
                          ? activeVariant.discountedPrice
                          : typeof productMain.discountedPrice === "number"
                            ? productMain.discountedPrice
                            : typeof activeVariant?.price === "number"
                              ? activeVariant.price
                              : productMain.price;
                      const discountsArr = normalizeQuantityDiscounts(
                        productMain.quantityDiscounts,
                      );
                      const unit = getDiscountedUnitPrice(
                        qty,
                        baseUnitPrice,
                        discountsArr,
                      );
                      const total = unit * qty;
                      return `= ${formatPrice(unit)} × ${qty} = ${formatPrice(total)}`;
                    })()}
                  </span>
                </div>
                <div className="button-block mt-5">
                  {quantityError && (
                    <div className="text-md mb-2 w-full text-center text-red-500">
                      {quantityError}
                    </div>
                  )}
                  <div
                    className={`duration-400 md:text-md hover:bg-black/75/75 hover:bg-green inline-block w-full rounded-[.25rem] bg-black px-10 py-4 text-center text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black hover:bg-black/75 hover:text-white md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4 ${quantityError ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                    onClick={handleBuyNow}
                    style={quantityError ? { pointerEvents: "none" } : {}}
                  >
                    Buy It Now
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-8 border-b border-[#ddd] pb-6 focus:border-[#ddd] lg:gap-20"></div>
                <div className="more-infor mt-6">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* <Link href={"/faqs"} className="flex items-center gap-1">
                      <ArrowClockwise className="body1" />
                      <div className="text-title">Delivery & Return</div>
                    </Link> */}
                    <button
                      type="button"
                      className="flex items-center gap-1"
                      onClick={() => {
                        setActiveTab("questions");
                        setShouldScrollToQuestion(true);
                      }}
                    >
                      <Question className="body1" />
                      <div className="text-title">Ask A Question</div>
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    <Timer className="body1" />
                    <div className="text-title">Estimated Delivery:</div>
                    <div className="text-secondary">
                      {calculateEstimatedDeliveryDate()}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1">
                    <div className="text-title">SKU:</div>
                    <div className="text-secondary">{displaySKU}</div>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                    <div className="text-title">Categories:</div>
                    <Link
                      href={`/products?category=${productMain.category?.id}`}
                      className="text-secondary hover:underline"
                    >
                      {productMain.category?.name}
                    </Link>
                  </div>
                </div>
              </div>

              {/* <div className="get-it mt-6 flex flex-col gap-4 sm:flex-row">
                <div className="item mt-4 flex flex-col items-start gap-2 bg-white px-3 py-1 sm:flex-row sm:items-center sm:gap-3">
                  <div>
                    <div className="icon-delivery-truck text-3xl sm:text-4xl"></div>
                    <div className="text-title">Free shipping</div>
                    <div className="mt-1 text-sm font-normal leading-5 text-secondary md:text-[13px]">
                      Free shipping on orders over {formatPrice(7500, undefined, true)}.
                    </div>
                  </div>
                </div>

                <div className="item mt-4 flex flex-col items-start gap-2 bg-white px-3 py-1 sm:flex-row sm:items-center sm:gap-3">
                  <div>
                    <div className="icon-phone-call text-3xl sm:text-4xl"></div>
                    <div className="text-title">Support everyday</div>
                    <div className="mt-1 text-sm font-normal leading-5 text-secondary md:text-[13px]">
                      Support from 8:30 AM to 10:00 PM everyday
                    </div>
                  </div>
                </div>

                <div className="item mt-4 flex flex-col items-start gap-2 bg-white px-3 py-1 sm:flex-row sm:items-center sm:gap-3">
                  <div>
                    <div className="icon-return text-3xl sm:text-4xl"></div>
                    <div className="text-title">7 Day Returns</div>
                    <div className="mt-1 text-sm font-normal leading-5 text-secondary md:text-[13px]">
                      Not impressed? Get a refund.
                      <br />
                      You have 7 days to break our hearts.
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>

        <div className="desc-tab mt-10 lg:flex lg:gap-x-8">
          <div className="mx-auto w-full min-w-0 !max-w-[1322px] flex-1 bg-white px-4 py-10 md:py-20">
            <div className="flex w-full items-center justify-center">
              <div className="menu-tab relative flex items-center gap-2 overflow-x-auto rounded-2xl bg-gray-100 p-1">
                {[
                  { key: "specifications", label: "Specifications" },
                  { key: "description", label: "Description" },
                  {
                    key: "questions",
                    label: `Questions (${questions?.length ?? 0})`,
                  },
                  {
                    key: "review",
                    label: `Reviews (${reviewStats.totalCount})`,
                  },
                ].map((tab) => (
                  <div
                    id={`tab-${tab.key}`}
                    key={tab.key}
                    className={`relative flex-shrink-0 cursor-pointer rounded-2xl px-5 py-2 font-semibold transition-all duration-300 ${
                      activeTab === tab.key
                        ? "bg-white text-black shadow"
                        : "bg-transparent text-secondary hover:bg-white/70"
                    }`}
                    onClick={() => handleActiveTab(tab.key)}
                  >
                    <h2 className="m-0 p-0 text-lg font-semibold">
                      {tab.label}
                    </h2>
                  </div>
                ))}
              </div>
            </div>
            <div className="desc-block mt-8">
              <div
                className={`desc-item description ${activeTab === "description" ? "open" : ""}`}
              >
                <h2 className="sr-only">Description</h2>
                <ParseContent content={productMain.description} />
              </div>
              <div
                className={`desc-item specifications ${activeTab === "specifications" ? "open" : ""}`}
              >
                <h2 className="mb-4 text-lg font-bold">Specifications</h2>
                <div className="w-full overflow-x-auto">
                  <h3 className="mb-4 whitespace-nowrap text-sm font-bold">
                    Details
                  </h3>
                  {productMain.attributes &&
                    Object.entries(productMain.attributes).map(
                      ([key, value], index) => (
                        <div
                          key={index}
                          className={`border-b border-t border-gray-200 px-3 py-3 transition-colors duration-200 hover:bg-gray-100 sm:px-5 ${
                            index % 2 === 0 ? "bg-surface" : ""
                          } flex flex-col md:flex-row md:items-center md:gap-4 lg:justify-between`}
                        >
                          <div className="text-title mb-1 break-words text-left font-semibold md:mb-0 md:w-1/3">
                            {key}
                          </div>
                          <div className="break-words text-left md:w-2/3">
                            {value}
                          </div>
                        </div>
                      ),
                    )}
                </div>
              </div>
              <div
                className={`desc-item questions-block ${activeTab === "questions" ? "open" : ""}`}
              >
                {activeTab === "questions" && (
                  <section
                    className="mx-8 mb-16 mt-0 max-w-3xl rounded-2xl border border-gray-100 bg-white px-8 pb-12 pt-8 shadow sm:mx-auto sm:px-8"
                    id="product-qa"
                  >
                    <div className="section-head mb-8 flex gap-4 px-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="title-n-action">
                        <h2 className="mb-1 text-xl font-bold text-gray-900 sm:text-2xl">
                          Questions ({questions?.length ?? 0})
                        </h2>
                        <p className="section-blurb text-sm text-gray-500">
                          Have question about this product? Get specific details
                          about this product from expert.
                        </p>
                      </div>
                      <div className="q-action">
                        {session?.user ? (
                          <Button
                            asChild
                            variant="default"
                            className="hover:bg-black/75/90 bg-black text-white hover:bg-black hover:bg-black/75"
                          >
                            <a href="#ask-question-form">Ask Question</a>
                          </Button>
                        ) : (
                          <Button
                            asChild
                            variant="default"
                            className="hover:bg-black/75/90 bg-black text-white hover:bg-black hover:bg-black/75"
                          >
                            <a href="/login">Ask Question</a>
                          </Button>
                        )}
                      </div>
                    </div>
                    <div id="question">
                      {isLoading ? (
                        <div className="py-10 text-center text-lg font-medium text-secondary">
                          Loading questions...
                        </div>
                      ) : questions && questions.length > 0 ? (
                        <div className="mb-10 space-y-7">
                          {questions.map(
                            (q: {
                              id: string;
                              user: { name: string | null };
                              createdAt: Date;
                              question: string;
                              answer?: string | null;
                            }) => (
                              <div
                                key={q.id}
                                className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {q.user.name ?? "Unknown User"}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(q.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-gray-700">
                                  {q.question}
                                </div>
                                {q.answer && (
                                  <div className="mt-2 rounded bg-gray-100 p-2 text-green-700">
                                    {q.answer}
                                  </div>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      ) : (
                        <div className="empty-content flex flex-col items-center justify-center py-12">
                          <div className="empty-text text-center text-lg text-gray-500">
                            There are no questions asked yet. Be the first one
                            to ask a question.
                          </div>
                        </div>
                      )}
                    </div>
                    {session?.user && (
                      <div id="ask-question-form" className="mt-12">
                        <form
                          onSubmit={handleAskQuestion}
                          className="mx-auto flex max-w-lg flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-8 shadow"
                        >
                          <label
                            htmlFor="question"
                            className="text-lg font-semibold text-gray-800"
                          >
                            Ask a question about this product:
                          </label>
                          <textarea
                            id="question"
                            className="w-full rounded-lg border border-[#ddd] px-4 py-3 text-base focus:border-[#ddd] focus:border-primary focus:ring-2 focus:ring-primary"
                            placeholder="Type your question here..."
                            value={questionText}
                            minLength={5}
                            maxLength={500}
                            onChange={(e) => setQuestionText(e.target.value)}
                            required
                            rows={3}
                            disabled={askQuestionMutation.isPending}
                          />
                          {error && (
                            <div className="text-sm text-red-500">{error}</div>
                          )}
                          <Button
                            type="submit"
                            disabled={askQuestionMutation.isPending}
                            className="hover:bg-black/75/90 w-full bg-black text-white hover:bg-black hover:bg-black/75"
                          >
                            {askQuestionMutation.isPending
                              ? "Submitting..."
                              : "Submit Question"}
                          </Button>
                        </form>
                      </div>
                    )}
                  </section>
                )}
              </div>
              <div
                className={`desc-item review-block ${activeTab === "review" ? "open" : ""}`}
              >
                <div className="top-overview border-b border-[#ddd] pb-6 focus:border-[#ddd]">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rating-summary bg-surface rounded-xl p-5 shadow-sm transition-all duration-300 hover:shadow-md">
                      <h3 className="text-lg font-semibold">Overall Rating</h3>
                      <div className="flex items-center justify-between">
                        <div className="rounded-full bg-black px-2 py-0.5 text-xs text-white hover:bg-black/75">
                          {reviewStats.totalCount}{" "}
                          {reviewStats.totalCount === 1 ? "Review" : "Reviews"}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-center">
                        <div className="relative flex flex-col items-center">
                          <div className="text-5xl font-bold">
                            {reviewStats.averageRating}
                          </div>
                          <div className="mt-2">
                            <Rate
                              currentRate={parseFloat(
                                reviewStats.averageRating,
                              )}
                              size={22}
                            />
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            out of 5
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rating-distribution bg-surface rounded-xl p-5 shadow-sm transition-all duration-300 hover:shadow-md sm:col-span-1 lg:col-span-1">
                      <h3 className="mb-3 text-lg font-semibold">
                        Rating Distribution
                      </h3>
                      <div className="space-y-2.5">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-2">
                            <div className="flex min-w-[32px] items-center gap-1">
                              <span className="font-medium">{rating}</span>
                              <Star
                                size={14}
                                weight="fill"
                                className="text-yellow-500"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className="absolute left-0 top-0 h-full rounded-full bg-yellow-500"
                                  style={{
                                    width: `${reviewStats.ratingPercentages[rating]}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="min-w-[40px] text-right text-sm text-gray-500">
                              {reviewStats.ratingPercentages[rating]}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="write-review-card bg-surface flex flex-col rounded-xl p-5 shadow-sm transition-all duration-300 hover:shadow-md">
                      <h3 className="mb-3 text-lg font-semibold">
                        Share Your Experience
                      </h3>
                      <p className="mb-4 text-sm text-gray-500">
                        Your honest feedback helps other shoppers make better
                        choices.
                      </p>
                      <Link
                        href={"#form-review"}
                        className="hover:bg-black/75/80 mt-auto inline-flex w-full items-center justify-center rounded-lg bg-black px-5 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-black hover:bg-black/75"
                      >
                        Write a Review
                      </Link>
                    </div>
                  </div>
                </div>
                {activeTab === "review" && (
                  <div className="mt-8">
                    <div className="heading flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="text-xl font-semibold capitalize leading-[30px] sm:text-[26px] sm:leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
                        {reviewStats.totalCount}{" "}
                        {reviewStats.totalCount === 1 ? "Comment" : "Comments"}
                      </div>
                      <div className="right flex w-full items-center gap-3 sm:w-auto">
                        <label
                          htmlFor="select-filter"
                          className="text-sm uppercase sm:text-base"
                        >
                          Sort by:
                        </label>
                        <div className="select-block relative flex-grow sm:flex-grow-0">
                          <select
                            id="select-filter"
                            name="select-filter"
                            className="w-full rounded-lg border border-[#ddd] bg-white py-2 pl-3 pr-10 text-sm font-semibold capitalize leading-[26px] focus:border-[#ddd] sm:w-auto sm:text-base md:pr-14 md:text-base md:leading-6"
                            value={reviewSortOrder}
                            onChange={handleReviewSortChange}
                          >
                            <option value="newest">Newest</option>
                            <option value="5star">5 Star</option>
                            <option value="4star">4 Star</option>
                            <option value="3star">3 Star</option>
                            <option value="2star">2 Star</option>
                            <option value="1star">1 Star</option>
                          </select>
                          <CaretDown
                            size={12}
                            className="absolute right-2 top-1/2 -translate-y-1/2 md:right-4"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="list-review mt-6">
                      {sortedReviews.length === 0 ? (
                        <div className="py-6 text-center">
                          No reviews yet. Be the first to review!
                        </div>
                      ) : (
                        sortedReviews.map((review) => (
                          <div
                            className="item bg-surface/30 hover:bg-surface mb-8 rounded-lg p-3 transition-all duration-300 sm:p-5"
                            key={review.id}
                          >
                            <div className="heading flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-0">
                              <div className="user-infor flex gap-4">
                                <div className="avatar">
                                  <Image
                                    src={
                                      review.user?.image ??
                                      "/images/avatar/default.png"
                                    }
                                    width={200}
                                    height={200}
                                    alt={review.user?.name ?? "Anonymous"}
                                    className="aspect-square w-[40px] rounded-full object-cover sm:w-[52px]"
                                  />
                                </div>
                                <div className="user">
                                  <div className="flex items-center gap-2">
                                    <div className="text-title">
                                      {review.user?.name ?? "Anonymous"}
                                    </div>
                                    <div className="span text-line">-</div>
                                    <Rate
                                      currentRate={review.rating}
                                      size={12}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-secondary2 text-sm">
                                      {formatDistanceToNow(
                                        new Date(review.createdAt),
                                        { addSuffix: true },
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="more-action cursor-pointer">
                                <DotsThree size={24} weight="bold" />
                              </div>
                            </div>
                            <div className="mt-3 text-sm sm:text-base">
                              {review.comment ?? "No comment provided."}
                            </div>
                            <div className="action mt-3">
                              <div className="flex items-center gap-4">
                                <div className="like-btn flex cursor-pointer items-center gap-1">
                                  <HandsClapping size={18} />
                                  <div className="text-base font-semibold capitalize leading-[26px] md:text-base md:leading-6">
                                    0
                                  </div>
                                </div>
                                <Link
                                  href={"#form-review"}
                                  className="reply-btn cursor-pointer text-base font-semibold capitalize leading-[26px] text-secondary md:text-base md:leading-6"
                                >
                                  Reply
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {session &&
                      (canReviewLoading ? (
                        <div>Checking purchase status...</div>
                      ) : canReview ? (
                        <div
                          id="form-review"
                          className="form-review bg-surface/20 rounded-lg p-4 pt-6 sm:p-6"
                        >
                          <div className="text-xl font-semibold capitalize leading-[30px] sm:text-[26px] sm:leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
                            Leave A comment
                          </div>
                          <form
                            className="mt-3 grid gap-4 gap-y-5 sm:grid-cols-2 md:mt-6"
                            onSubmit={handleReviewSubmit}
                          >
                            <div className="col-span-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                              <div className="text-title">Your Rating:</div>
                              <div className="flex cursor-pointer">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={20}
                                    weight={
                                      star <= reviewForm.rating
                                        ? "fill"
                                        : "regular"
                                    }
                                    className="text-yellow-500 transition-all hover:scale-110"
                                    onClick={() =>
                                      setReviewForm({
                                        ...reviewForm,
                                        rating: star,
                                      })
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                            <textarea
                              className="w-full rounded-lg border border-[#ddd] px-4 py-3 focus:border-[#ddd]"
                              id="message"
                              name="comment"
                              placeholder="Your review *"
                              required
                              rows={4}
                              value={reviewForm.comment}
                              onChange={(e) =>
                                setReviewForm({
                                  ...reviewForm,
                                  comment: e.target.value,
                                })
                              }
                            ></textarea>
                            <div className="col-span-full sm:pt-3">
                              <Button
                                variant="black"
                                type="submit"
                                disabled={addReviewMutation.isPending}
                                className=""
                              >
                                {addReviewMutation.isPending
                                  ? "Submitting..."
                                  : "Submit Review"}
                              </Button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="form-review bg-surface/20 rounded-lg p-4 pt-6 text-red-500 sm:p-6">
                          You can only review products you have purchased.
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="hidden w-full max-w-xs flex-shrink-0 lg:block">
            <RelatedProductsSidebar
              categoryId={
                productMain.category?.id ?? productMain.categoryId ?? undefined
              }
              excludeProductId={productMain.id}
            />
          </div>
        </div>
        <div className="mt-8 block w-full lg:hidden">
          <RelatedProductsSidebar
            categoryId={
              productMain.category?.id ?? productMain.categoryId ?? undefined
            }
            excludeProductId={productMain.id}
          />
        </div>
      </div>
      <style jsx global>{`
        /* Hide number input spinners for all browsers */
        input.quantity-input::-webkit-outer-spin-button,
        input.quantity-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input.quantity-input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </>
  );
}
