"use client";

import { useCartStore } from "@/context/store-context/CartContext";
import Image from "next/image";
import { formatPrice } from "../../../utils/format";

interface CartItemProp {
  price: number;
  quantity: number;
  id: string;
  name: string;
  coverImage: string;
  discountedPrice?: number;
}

interface CartProductItemProps {
  item: CartItemProp;
}

export default function CartProductItem({ item }: CartProductItemProps) {
  const { removeFromCart } = useCartStore();
  return (
    <div className="w-full items-center gap-3">
      <div className="bg-img aspect-square w-full flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={item.coverImage ?? "/images/placeholder-image.png"}
          width={300}
          height={300}
          alt={item.name}
          sizes="(max-width: 640px) 80px, (max-width: 1024px) 100px, 100px"
          className="h-full w-full rounded-lg object-contain"
        />
      </div>
      <div className="w-full">
        <div className="flex w-full items-center justify-between">
          <div className="name text-base font-semibold capitalize leading-[26px] md:text-base md:leading-6">
            {item.name}
          </div>
          <div
            className="cursor-pointer text-base font-semibold leading-[22] text-red-500 underline md:text-[13px] md:leading-5"
            onClick={() => removeFromCart(item.id)}
          >
            Remove
          </div>
        </div>
        <div className="item-price text-title">
          {formatPrice(item.discountedPrice ?? item.price)}
        </div>
      </div>
    </div>
  );
}
