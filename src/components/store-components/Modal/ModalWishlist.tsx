"use client";

import { Button } from "@/components/ui/button";
import { useModalWishlistStore } from "@/context/store-context/ModalWishlistContext";
import { api } from "@/trpc/react";
import { X } from "@phosphor-icons/react/dist/ssr";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import type { WishlistProduct } from "./WishProductItem";
import WishProductItem from "./WishProductItem";

const ModalWishlist = () => {
  const { isModalOpen, closeModalWishlist } = useModalWishlistStore();
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
      <>
        <div className={`modal-wishlist-block`} onClick={closeModalWishlist}>
          <div
            className={`modal-wishlist-main py-6 ${isModalOpen ? "open" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="heading relative flex items-center justify-between px-6 pb-3">
              <div className="heading5">Wishlist</div>
              <div
                className="close-btn bg-surface absolute right-6 top-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full duration-300 hover:bg-black hover:bg-black/75 hover:text-white"
                onClick={closeModalWishlist}
              >
                <X size={14} />
              </div>
            </div>
            <div className="list-product px-6">
              <div className="text-center text-base font-semibold text-gray-600">
                Login to add products to your wishlist.
              </div>
              <div className="mt-4 flex justify-center">
                <Button
                  variant="default"
                  className="w-full max-w-xs bg-black text-white hover:bg-black/75"
                  onClick={() =>
                    signIn(undefined, { callbackUrl: window.location.href })
                  }
                >
                  Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className={`modal-wishlist-block`} onClick={closeModalWishlist}>
          <div
            className={`modal-wishlist-main py-6 ${isModalOpen ? "open" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="heading relative flex items-center justify-between px-6 pb-3">
              <div className="heading5">Wishlist</div>
              <div
                className="close-btn bg-surface absolute right-6 top-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full duration-300 hover:bg-black hover:bg-black/75 hover:text-white"
                onClick={closeModalWishlist}
              >
                <X size={14} />
              </div>
            </div>
            <div className="list-product px-6">
              <div className="text-center text-base font-semibold text-gray-600">
                Loading your wishlist...
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <div className={`modal-wishlist-block`} onClick={closeModalWishlist}>
          <div
            className={`modal-wishlist-main py-6 ${isModalOpen ? "open" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="heading relative flex items-center justify-between px-6 pb-3">
              <div className="heading5">Wishlist</div>
              <div
                className="close-btn bg-surface absolute right-6 top-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full duration-300 hover:bg-black hover:bg-black/75 hover:text-white"
                onClick={closeModalWishlist}
              >
                <X size={14} />
              </div>
            </div>
            <div className="list-product px-6">
              <div className="text-center text-base font-semibold text-red-600">
                Failed to load your wishlist. Please try again later.
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={`modal-wishlist-block`} onClick={closeModalWishlist}>
        <div
          className={`modal-wishlist-main py-6 ${isModalOpen ? "open" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="heading relative flex items-center justify-between px-6 pb-3">
            <div className="heading5">Wishlist</div>
            <div
              className="close-btn bg-surface absolute right-6 top-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full duration-300 hover:bg-black hover:bg-black/75 hover:text-white"
              onClick={closeModalWishlist}
            >
              <X size={14} />
            </div>
          </div>
          <div className="list-product max-h-[350px] overflow-y-auto px-6">
            {!wishList || wishList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mb-4 h-14 w-14 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8.25V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v1.5M3 8.25l1.5 10.5A2.25 2.25 0 006.75 21h10.5a2.25 2.25 0 002.25-2.25L21 8.25M3 8.25h18"
                  />
                </svg>
                <div className="mb-1 text-lg font-semibold text-gray-700">
                  Your wishlist is empty
                </div>
                <div className="mb-4 max-w-xs text-center text-gray-500">
                  Add products to your wishlist to keep track of items you love.
                  Start exploring our collection and add your favorites!
                </div>
                <Link
                  href="/products"
                  className="inline-block rounded bg-black px-5 py-2 font-semibold text-white shadow transition hover:bg-black/80"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              wishList.map((w: WishlistProduct) => (
                <WishProductItem
                  key={w.product.id}
                  item={w}
                  onRemove={() =>
                    removeFromWishlistMutation.mutate({
                      productId: w.product.id,
                    })
                  }
                />
              ))
            )}
          </div>
          <div className="footer-modal absolute bottom-0 left-0 w-full border-t border-[#ddd] bg-white p-6 text-center focus:border-[#ddd]">
            <Link
              href={"/wishlist"}
              onClick={closeModalWishlist}
              className="button-main w-full text-center uppercase"
            >
              View All Wish List
            </Link>
            <Link
              href={"/products"}
              onClick={closeModalWishlist}
              className="has-line-before mt-4 inline-block cursor-pointer text-center text-sm font-semibold uppercase leading-5 md:text-xs md:leading-4"
            >
              Or continue shopping
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalWishlist;
