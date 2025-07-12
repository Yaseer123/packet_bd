"use client";

// QuickView.tsx
import { useCartStore } from "@/context/store-context/CartContext";
import { useModalCartStore } from "@/context/store-context/ModalCartContext";
import { useModalQuickViewStore } from "@/context/store-context/ModalQuickViewContext";
import { useModalWishlistStore } from "@/context/store-context/ModalWishlistContext";
import { useWishlistStore } from "@/context/store-context/WishlistContext";
import { generateSKU } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { Variant } from "@/types/ProductType";
import {
  ArrowClockwise,
  Heart,
  Minus,
  Plus,
  Question,
  ShareNetwork,
  Timer,
  X,
} from "@phosphor-icons/react/dist/ssr";
import type { Product } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "../../../utils/format";
import Rate from "../Rate";

const ModalQuickView = () => {
  const { selectedProduct, closeQuickView } = useModalQuickViewStore() as {
    selectedProduct: Product | null;
    closeQuickView: () => void;
  };
  const [quantity, setQuantity] = useState<number>(1);
  const { addToCart, updateCart, cartArray } = useCartStore();
  const { openModalCart } = useModalCartStore();
  const { addToWishlist, removeFromWishlist, wishlistArray } =
    useWishlistStore();
  const { openModalWishlist } = useModalWishlistStore();
  const router = useRouter();

  // Fetch category hierarchy for primary category name
  const { data: categoryHierarchy } = api.category.getHierarchy.useQuery(
    selectedProduct?.categoryId
      ? { id: selectedProduct.categoryId }
      : { id: "" },
    { enabled: !!selectedProduct?.categoryId },
  );

  // Reset quantity when selected product changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedProduct]);

  const percentSale =
    selectedProduct?.discountedPrice &&
    selectedProduct.discountedPrice < selectedProduct.price &&
    Math.floor(
      100 - (selectedProduct.discountedPrice / selectedProduct.price) * 100,
    );

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const getVariantField = (field: keyof Variant): string | undefined => {
    if (!selectedProduct) return undefined;
    let variants: unknown = selectedProduct.variants;
    if (!variants) return undefined;
    if (typeof variants === "string") {
      try {
        variants = JSON.parse(variants);
      } catch {
        return undefined;
      }
    }
    if (
      Array.isArray(variants) &&
      variants.length > 0 &&
      typeof variants[0] === "object" &&
      variants[0] !== null
    ) {
      const variant = variants[0] as Variant;
      const value = variant[field];
      return typeof value === "string" ? value : undefined;
    }
    return undefined;
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      // Get primary category name for SKU
      const primaryCategoryName = categoryHierarchy?.[0]?.name ?? "XX";
      // Use color/size/sku from variant if available
      const color = getVariantField("colorName");
      const size = getVariantField("size");
      const sku =
        getVariantField("sku") ??
        generateSKU({
          categoryName: primaryCategoryName,
          productId: selectedProduct.id,
          color,
          size,
        });
      if (!cartArray.find((item) => item.id === selectedProduct.id)) {
        // Create a new item to add to cart
        addToCart({
          id: selectedProduct.id,
          name: selectedProduct.title,
          price: selectedProduct.price,
          discountedPrice: selectedProduct.discountedPrice ?? undefined,
          quantity,
          coverImage: selectedProduct.images[0] ?? "",
          sku,
          color,
          size,
          productId: selectedProduct.id,
        });
      }
      // Always update the quantity whether it's a new item or existing one
      updateCart(selectedProduct.id, quantity);
      openModalCart();
      closeQuickView();
    }
  };

  const handleAddToWishlist = () => {
    // if product existed in wishlist, remove from wishlist and set state to false
    if (selectedProduct) {
      if (wishlistArray.some((item) => item.id === selectedProduct.id)) {
        removeFromWishlist(selectedProduct.id);
      } else {
        // else, add to wishlist and set state to true
        addToWishlist(selectedProduct);
      }
    }
    openModalWishlist();
  };

  const handleBuyNow = () => {
    if (selectedProduct) {
      const color = getVariantField("colorName");
      const size = getVariantField("size");
      const sku = getVariantField("sku") ?? "";
      if (!cartArray.find((item) => item.id === selectedProduct.id)) {
        addToCart({
          id: selectedProduct.id,
          name: selectedProduct.title,
          price: selectedProduct.price,
          discountedPrice: selectedProduct.discountedPrice ?? undefined,
          quantity,
          coverImage: selectedProduct.images[0] ?? "",
          sku,
          color,
          size,
          productId: selectedProduct.id,
        });
      }
      updateCart(selectedProduct.id, quantity);
      closeQuickView();
      router.push("/checkout");
    }
  };

  if (!selectedProduct) return null;

  return (
    <>
      <div className={`modal-quickview-block`} onClick={closeQuickView}>
        <div
          className={`modal-quickview-main py-6 ${selectedProduct !== null ? "open" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="flex h-full gap-y-6 max-md:flex-col-reverse">
            <div className="left flex-shrink-0 px-6 md:w-[300px] lg:w-[388px]">
              <div className="list-img items-center gap-4 max-md:flex">
                {selectedProduct?.images.map((item, index) => (
                  <div
                    className="bg-img aspect-[3/4] w-full overflow-hidden rounded-[20px] max-md:w-[150px] max-md:flex-shrink-0 md:mt-6"
                    key={index}
                  >
                    <Image
                      src={item}
                      width={1500}
                      height={2000}
                      alt={item}
                      priority={true}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="right w-full px-4">
              <div className="heading relative flex items-center justify-between px-4 pb-6">
                <div className="heading5">Quick View</div>
                <div
                  className="close-btn bg-surface absolute right-0 top-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full duration-300 hover:bg-black hover:bg-black/75 hover:text-white"
                  onClick={closeQuickView}
                >
                  <X size={14} />
                </div>
              </div>
              <div className="product-infor px-4">
                <div className="flex justify-between">
                  <div>
                    <div className="mt-1 text-[30px] font-semibold capitalize leading-[42px] md:text-[18px] md:leading-[28px] lg:text-[26px] lg:leading-[32px]">
                      {selectedProduct?.title}
                    </div>
                  </div>
                  <div
                    className={`add-wishlist-btn flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#ddd] duration-300 hover:bg-black hover:bg-black/75 hover:text-white focus:border-[#ddd] ${wishlistArray.some((item) => item.id === selectedProduct?.id) ? "active" : ""}`}
                    onClick={handleAddToWishlist}
                  >
                    {wishlistArray.some(
                      (item) => item.id === selectedProduct?.id,
                    ) ? (
                      <>
                        <Heart
                          size={20}
                          weight="fill"
                          className="text-red-500"
                        />
                      </>
                    ) : (
                      <>
                        <Heart size={20} />
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center">
                  <Rate currentRate={0} size={14} />
                  <span className="text-base font-normal leading-[22] text-secondary md:text-[13px] md:leading-5">
                    (1.234 reviews)
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-[#ddd] pb-6 focus:border-[#ddd]">
                  {selectedProduct.stockStatus === "OUT_OF_STOCK" ? (
                    <div className="product-price heading5 font-bold text-red-500">
                      Out Of Stock
                    </div>
                  ) : (
                    <>
                      <div className="product-price heading5 discounted-price">
                        {formatPrice(
                          selectedProduct.discountedPrice ??
                            selectedProduct.price,
                        )}
                      </div>
                      {selectedProduct.discountedPrice &&
                        selectedProduct.discountedPrice <
                          selectedProduct.price && (
                          <>
                            <div className="bg-line h-4 w-px"></div>
                            <div className="product-origin-price text-secondary2 font-normal">
                              <del>{formatPrice(selectedProduct.price)}</del>
                            </div>
                            <div className="product-sale caption2 bg-green inline-block rounded-full px-3 py-0.5 font-semibold">
                              -{percentSale}%
                            </div>
                          </>
                        )}
                    </>
                  )}
                  <div className="desc mt-3 text-secondary">
                    {selectedProduct.shortDescription}
                  </div>
                </div>
                <div className="list-action mt-6">
                  <div className="text-title mt-5">Quantity:</div>
                  <div className="choose-quantity mt-3 flex items-center gap-5 max-xl:flex-wrap lg:justify-between">
                    <div className="quantity-block flex w-[120px] flex-shrink-0 items-center justify-between rounded-lg border border-[#ddd] focus:border-[#ddd] max-md:px-3 max-md:py-1.5 sm:w-[180px] md:p-3">
                      <Minus
                        onClick={handleDecreaseQuantity}
                        className={`${quantity === 1 ? "disabled" : ""} body1 cursor-pointer`}
                      />
                      <div className="body1 font-semibold">{quantity}</div>
                      <Plus
                        onClick={handleIncreaseQuantity}
                        className="body1 cursor-pointer"
                      />
                    </div>
                    <div
                      onClick={handleAddToCart}
                      className="duration-400 md:text-md hover:bg-green inline-block w-full cursor-pointer rounded-[.25rem] border border-black bg-white px-10 py-4 text-center text-sm font-semibold uppercase leading-5 text-black transition-all ease-in-out md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4"
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
                  <div className="mt-5 flex flex-wrap items-center gap-8 gap-y-4 lg:gap-20">
                    <div className="share flex cursor-pointer items-center gap-3">
                      <div className="share-btn flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#ddd] duration-300 hover:bg-black hover:bg-black/75 hover:text-white focus:border-[#ddd] md:h-12 md:w-12">
                        <ShareNetwork weight="fill" className="heading6" />
                      </div>
                      <span>Share Products</span>
                    </div>
                  </div>
                  <div className="more-infor mt-6">
                    <div className="flex flex-wrap items-center gap-4">
                      <Link href={"/faqs"} className="flex items-center gap-1">
                        <ArrowClockwise className="body1" />
                        <div className="text-title">Delivery & Return</div>
                      </Link>
                      <div className="flex items-center gap-1">
                        <Question className="body1" />
                        <div className="text-title">Ask A Question</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1">
                      <Timer className="body1" />
                      <span className="text-title">Estimated Delivery:</span>
                      <span className="text-secondary">
                        14 January - 18 January
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-1">
                      <div className="text-title">SKU:</div>
                      <div className="text-secondary">53453412</div>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      <div className="text-title">Category:</div>
                      <div className="text-secondary">
                        {selectedProduct?.categoryId}
                      </div>
                    </div>
                  </div>
                  <div className="list-payment mt-7">
                    <div className="main-content relative rounded-xl border border-[#ddd] px-3 pb-4 pt-6 focus:border-[#ddd] max-md:w-2/3 max-sm:w-full sm:px-4 lg:pb-6 lg:pt-8">
                      <div className="heading6 absolute -top-[14px] left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-5">
                        Guaranteed safe checkout
                      </div>
                      <div className="list grid grid-cols-6">
                        <div className="item flex items-center justify-center px-1 lg:px-3">
                          <Image
                            src={"/images/payment/Frame-0.png"}
                            width={500}
                            height={450}
                            alt="payment"
                            className="w-full"
                          />
                        </div>
                        <div className="item flex items-center justify-center px-1 lg:px-3">
                          <Image
                            src={"/images/payment/Frame-1.png"}
                            width={500}
                            height={450}
                            alt="payment"
                            className="w-full"
                          />
                        </div>
                        <div className="item flex items-center justify-center px-1 lg:px-3">
                          <Image
                            src={"/images/payment/Frame-2.png"}
                            width={500}
                            height={450}
                            alt="payment"
                            className="w-full"
                          />
                        </div>
                        <div className="item flex items-center justify-center px-1 lg:px-3">
                          <Image
                            src={"/images/payment/Frame-3.png"}
                            width={500}
                            height={450}
                            alt="payment"
                            className="w-full"
                          />
                        </div>
                        <div className="item flex items-center justify-center px-1 lg:px-3">
                          <Image
                            src={"/images/payment/Frame-4.png"}
                            width={500}
                            height={450}
                            alt="payment"
                            className="w-full"
                          />
                        </div>
                        <div className="item flex items-center justify-center px-1 lg:px-3">
                          <Image
                            src={"/images/payment/Frame-5.png"}
                            width={500}
                            height={450}
                            alt="payment"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalQuickView;
