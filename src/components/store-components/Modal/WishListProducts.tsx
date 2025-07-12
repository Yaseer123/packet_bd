"use client";

import { api } from "@/trpc/react";
import type { Product } from "@prisma/client";
import { useSession } from "next-auth/react";
import Image from "next/image";

type WishlistItem = {
  id: string;
  productId: string;
  userId: string;
  createdAt: Date;
  product: Product;
};

export default function WishListProducts() {
  const { data: session } = useSession(); // Check if the user is logged in

  const utils = api.useUtils();

  const {
    data: wishList,
    isLoading,
    isError,
  } = api.wishList.getWishList.useQuery(undefined, {
    enabled: !!session?.user, // Only fetch wishlist if the user is logged in
  });

  const removeFromWishlistMutation =
    api.wishList.removeFromWishList.useMutation({
      onSuccess: async () => {
        await utils.wishList.getWishList.invalidate(); // Invalidate the cache to refresh the wishlist
      },
    });

  if (!session?.user) {
    return (
      <div className="text-center text-lg font-semibold text-gray-600">
        Login to view your wishlist.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center text-lg font-semibold text-gray-600">
        Loading your wishlist...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-lg font-semibold text-red-600">
        Failed to load your wishlist. Please try again later.
      </div>
    );
  }

  return (
    <div className="list-product px-6">
      {wishList?.map((item: WishlistItem) =>
        typeof item.product === "object" && item.product !== null ? (
          <div
            key={item.id}
            className="item flex items-center justify-between gap-3 border-b border-[#ddd] py-5 focus:border-[#ddd]"
          >
            <div className="infor flex items-center gap-5">
              <div className="bg-img">
                <Image
                  src={item.product.images[0] ?? "/images/product/1.png"}
                  width={300}
                  height={300}
                  alt={item.product.title}
                  className="aspect-square w-[100px] flex-shrink-0 rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-base font-semibold">
                  {item.product.title}
                </h4>
                <span className="text-sm text-gray-500">
                  {item.product.discountedPrice ?? item.product.price}
                </span>
              </div>
            </div>
            <div
              className="remove-wishlist-btn cursor-pointer text-base font-semibold leading-[22] text-red-500 underline md:text-[13px] md:leading-5"
              onClick={() =>
                removeFromWishlistMutation.mutate({
                  productId: item.product.id,
                })
              }
            >
              Remove
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}
