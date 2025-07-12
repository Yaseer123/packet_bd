"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/context/store-context/CartContext";
import { useModalCartStore } from "@/context/store-context/ModalCartContext";
import { useModalWishlistStore } from "@/context/store-context/ModalWishlistContext";
import { generateSKU } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { ProductWithCategory } from "@/types/ProductType";
import {
  ArrowClockwise,
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
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });
  const [reviewSortOrder, setReviewSortOrder] = useState("newest");

  const { addToCart, updateCart, cartArray } = useCartStore();
  const { openModalCart } = useModalCartStore();
  const { openModalWishlist } = useModalWishlistStore();
  const utils = api.useUtils();

  const [wishlistResponse] = api.wishList.getWishList.useSuspenseQuery();
  const wishlist = wishlistResponse ?? [];

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
        utils.wishList.getWishList.setData(undefined, context.previousWishlist);
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
    setProductQuantity(productQuantity + 1);
  };

  const handleDecreaseQuantity = () => {
    if (productQuantity > 1) {
      setProductQuantity(productQuantity - 1);
      // updateCart(productMain.id, productMain.quantityPurchase - 1);
    }
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
    // Determine if a variant is selected
    const isVariantSelected = !!(selectedColorHex && selectedSize);
    // Build cart item
    const primaryCategoryName = categoryHierarchy?.[0]?.name ?? "XX";
    const cartItem = {
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
        categoryName: primaryCategoryName,
        productId: productMain.id,
        color: selectedColorName,
        size: selectedSize,
      }),
      color: selectedColorHex, // for swatch
      colorName: selectedColorName, // for display
      size: selectedSize,
      productId: productMain.id,
    };
    // Add to cart (allow multiple variants)
    if (!cartArray.find((item) => item.id === cartItem.id)) {
      addToCart(cartItem);
      updateCart(cartItem.id, productQuantity);
    } else {
      updateCart(cartItem.id, productQuantity);
    }
    openModalCart();
  };

  const isInWishlist = (itemId: string): boolean => {
    return wishlist.some((item: WishlistItem) => item.productId === itemId);
  };

  const handleAddToWishlist = () => {
    if (isInWishlist(productMain.id)) {
      // **Optimistic UI Update: Remove item immediately**
      utils.wishList.getWishList.setData(
        undefined,
        (old: WishlistItem[] | undefined) =>
          old?.filter((item) => item.product.id !== productMain.id) ?? [],
      );

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
      utils.wishList.getWishList.setData(
        undefined,
        (old: WishlistItem[] | undefined) => [
          ...(old ?? []),
          {
            id: uuid(),
            product: productMain,
            createdAt: new Date(),
            userId: session?.user.id ?? "temp-user",
            productId: productMain.id,
          },
        ],
      );

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
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    productMain.defaultSize ?? undefined,
  );

  // Show default color swatch and name
  const defaultColorHex =
    productMain.defaultColorHex ?? productMain.defaultColor ?? undefined;
  const defaultColorName =
    productMain.defaultColor ?? productMain.defaultColorHex ?? undefined;

  // Get available colors and sizes based on current selection
  const availableColors = variants
    ? variants
        .map((v) => ({
          colorHex: v.colorHex ?? v.colorName ?? "#ffffff",
          colorName: v.colorName ?? v.colorHex ?? "Unnamed",
        }))
        .filter((v) => v.colorHex && v.colorName)
    : [];
  console.log(availableColors);
  const availableSizes = variants
    ? [
        ...new Set(
          variants
            .filter((v) =>
              selectedColorHex ? v.colorHex === selectedColorHex : true,
            )
            .map((v) => v.size)
            .filter(Boolean),
        ),
      ]
    : [];

  // Find the most specific variant (for now, only by color)
  let activeVariant: ProductVariant | undefined = undefined;
  if (selectedColorHex) {
    activeVariant = variants.find((v) => v.colorHex === selectedColorHex);
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

  // Build a unified color list: default color (if set) + unique variant colors (excluding duplicate with default)
  const unifiedColors: { colorHex: string; colorName: string }[] = [];
  if (defaultColorHex) {
    unifiedColors.push({
      colorHex: defaultColorHex,
      colorName: defaultColorName ?? defaultColorHex,
    });
  }
  if (availableColors.length > 0) {
    availableColors.forEach((colorObj) => {
      // Avoid duplicate with default color
      if (!unifiedColors.some((c) => c.colorHex === colorObj.colorHex)) {
        unifiedColors.push({
          colorHex: colorObj.colorHex ?? "#ffffff",
          colorName: colorObj.colorName ?? colorObj.colorHex ?? "Unnamed",
        });
      }
    });
  }

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

  return (
    <>
      <div className="product-detail sale mb-5">
        {/* Social Share Row with border, rounded, and shadow */}
        <div className="mb-4 flex items-center justify-between px-4 pt-4 md:px-4">
          <div className="w-full">
            <div className="flex flex-row items-center justify-between gap-3 rounded-full border bg-white px-6 py-3 shadow md:flex-row md:gap-0 md:px-6 md:py-2">
              <div className="flex items-center justify-center gap-2">
                <span className="font-semibold text-gray-700">Share:</span>
                {/* Messenger */}
                {/* <a
                  href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101828] text-white hover:opacity-80"
                  title="Share on Messenger"
                >
                  <FaFacebookMessenger size={18} />
                </a> */}
                {/* Pinterest */}
                <a
                  href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101828] text-white hover:opacity-80"
                  title="Share on Pinterest"
                >
                  <FaPinterestP size={18} />
                </a>
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101828] text-white hover:opacity-80"
                  title="Share on WhatsApp"
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
              {/* Unified Color Selector */}
              {unifiedColors.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Color:</span>
                    {unifiedColors.map((colorObj, idx) => (
                      <div
                        key={String(colorObj.colorHex) + idx}
                        className="mx-1 flex flex-col items-center"
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
                            setSelectedSize(undefined);
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
                  {/* Size selector (only if sizes available for selected color) */}
                  {availableSizes.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-semibold">Size:</span>
                      {availableSizes.map((size, idx) =>
                        size ? (
                          <button
                            key={size + idx}
                            className={`rounded border px-3 py-1 ${selectedSize === size ? "border-2 border-blue-500 bg-black text-white" : "bg-white text-black"} ${size === productMain.defaultSize ? "ring-2 ring-blue-400" : ""}`}
                            onClick={() => setSelectedSize(size)}
                          >
                            {size}
                            {size === productMain.defaultSize ? (
                              <span className="ml-1 text-xs text-blue-600">
                                (default)
                              </span>
                            ) : null}
                          </button>
                        ) : null,
                      )}
                      {productMain.defaultSize && (
                        <button
                          className={`rounded border px-3 py-1 ${!selectedSize ? "bg-black text-white" : "bg-white text-black"}`}
                          onClick={() => setSelectedSize(undefined)}
                        >
                          {productMain.defaultSize}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* Images Swiper */}
              <Swiper
                slidesPerView={1}
                spaceBetween={0}
                thumbs={{ swiper: thumbsSwiper }}
                modules={[Thumbs]}
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
                  <div className="mt-1 text-[30px] font-semibold capitalize leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
                    {productMain.title}
                  </div>
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
                    </div>
                    <div className="bg-line h-4 w-px"></div>
                    <div className="product-origin-price text-secondary2 font-normal">
                      <del>{formatPrice(displayPrice)}</del>
                    </div>
                  </>
                ) : (
                  <div className="product-price heading5">
                    {formatPrice(displayPrice)}
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
                <div className="text-title mt-5">Quantity:</div>
                <div className="choose-quantity mt-3 flex items-center gap-5 gap-y-3 lg:justify-between">
                  <div className="quantity-block flex w-[120px] flex-shrink-0 items-center justify-between rounded-lg border border-[#ddd] bg-white focus:border-[#ddd] max-md:px-3 max-md:py-1.5 sm:w-[180px] md:p-3">
                    <Minus
                      size={20}
                      onClick={handleDecreaseQuantity}
                      className={`${productQuantity === 1 ? "disabled" : ""} cursor-pointer`}
                    />
                    <div className="body1 font-semibold">{productQuantity}</div>
                    <Plus
                      size={20}
                      onClick={handleIncreaseQuantity}
                      className="cursor-pointer"
                    />
                  </div>
                  <div
                    onClick={handleAddToCart}
                    className="duration-400 md:text-md inline-block w-full cursor-pointer rounded-[.25rem] border border-black bg-white px-0 py-4 text-center text-sm font-semibold uppercase leading-5 text-black transition-all ease-in-out hover:bg-black hover:bg-black/75 hover:text-white md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4"
                  >
                    Add To Cart
                  </div>
                </div>
                <div className="button-block mt-5">
                  <div
                    className="duration-400 md:text-md hover:bg-black/75/75 hover:bg-green inline-block w-full cursor-pointer rounded-[.25rem] bg-black px-10 py-4 text-center text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black hover:bg-black/75 hover:text-white md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4"
                    onClick={handleBuyNow}
                  >
                    Buy It Now
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-8 border-b border-[#ddd] pb-6 focus:border-[#ddd] lg:gap-20"></div>
                <div className="more-infor mt-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <Link href={"/faqs"} className="flex items-center gap-1">
                      <ArrowClockwise className="body1" />
                      <div className="text-title">Delivery & Return</div>
                    </Link>
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

              <div className="get-it mt-6 flex flex-col gap-4 sm:flex-row">
                <div className="item mt-4 flex flex-col items-start gap-2 bg-white px-3 py-1 sm:flex-row sm:items-center sm:gap-3">
                  <div>
                    <div className="icon-delivery-truck text-3xl sm:text-4xl"></div>
                    <div className="text-title">Free shipping</div>
                    <div className="mt-1 text-sm font-normal leading-5 text-secondary md:text-[13px]">
                      Free shipping on orders over {formatPrice(7500)}.
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
              </div>
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
                    {tab.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="desc-block mt-8">
              <div
                className={`desc-item description ${activeTab === "description" ? "open" : ""}`}
              >
                <ParseContent content={productMain.description} />
              </div>
              <div
                className={`desc-item specifications ${activeTab === "specifications" ? "open" : ""}`}
              >
                <div className="w-full overflow-x-auto">
                  <h3 className="mb-4 whitespace-nowrap text-sm font-bold">
                    Specifications
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
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          Overall Rating
                        </h3>
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
    </>
  );
}
