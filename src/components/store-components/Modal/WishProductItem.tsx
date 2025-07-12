"use client";

import { Trash } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { formatPrice } from "../../../utils/format";

// The shape of a wishlist item as returned by the API
export interface WishlistProduct {
  id: string;
  productId: string;
  product: {
    id: string;
    title: string;
    price: number;
    discountedPrice?: number | null;
    images: string[];
  };
}

interface WishProductItemProps {
  item: WishlistProduct;
  onRemove: (productId: string) => void;
}

export default function WishProductItem({
  item,
  onRemove,
}: WishProductItemProps) {
  const { product } = item;
  return (
    <div className="item flex w-full items-center justify-between gap-3 border-b border-[#ddd] py-5 focus:border-[#ddd] sm:flex-row">
      <div className="infor flex w-full items-center gap-3 sm:flex-row sm:gap-5">
        <div className="bg-img aspect-square w-[80px] flex-shrink-0 overflow-hidden rounded-lg sm:w-[100px]">
          <Image
            src={product.images[0] ?? "/images/product/1.png"}
            width={300}
            height={300}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="w-full">
          <div className="name text-base font-semibold capitalize leading-[26px] md:text-base md:leading-6">
            {product.title}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="item-price text-title">
              {formatPrice(product.discountedPrice ?? product.price)}
            </div>
            {product.discountedPrice &&
              product.discountedPrice < product.price && (
                <div className="item-origin-price text-secondary2">
                  <del>{formatPrice(product.price)}</del>
                </div>
              )}
          </div>
        </div>
      </div>
      <div
        className="remove-wishlist-btn mt-2 cursor-pointer text-base font-semibold leading-[22] text-red-500 underline sm:mt-0 md:text-[13px] md:leading-5"
        onClick={() => onRemove(product.id)}
      >
        <Trash size={18} />
      </div>
    </div>
  );
}
