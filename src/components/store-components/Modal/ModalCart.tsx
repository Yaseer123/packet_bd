"use client";

import { useCartStore } from "@/context/store-context/CartContext";
import { useModalCartStore } from "@/context/store-context/ModalCartContext";
import { Minus, Plus, Trash, X } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "../../../utils/format";
import CartProductItem from "./CartProductItem";

const ModalCart = () => {
  const { isModalOpen, closeModalCart } = useModalCartStore();
  const { cartArray: cartState, removeFromCart, updateCart } = useCartStore();

  // Per-item state for input value and error
  const [inputStates, setInputStates] = useState<
    Record<string, { value: string; error: string }>
  >({});

  // Sync input state with cart state (initialize on open or cart change)
  useEffect(() => {
    if (!isModalOpen) return;
    const newStates: Record<string, { value: string; error: string }> = {};
    cartState.forEach((item) => {
      newStates[item.id] = {
        value: String(item.quantity),
        error: "",
      };
    });
    setInputStates(newStates);
  }, [cartState, isModalOpen]);

  let totalCart = 0;
  cartState.forEach(
    (item) =>
      (totalCart += (item.discountedPrice ?? item.price) * item.quantity),
  );

  const pathname = usePathname();

  // Validation function
  const validateQuantity = (val: string, min: number, max?: number): string => {
    if (val === "" || isNaN(Number(val))) {
      return "Please enter a quantity.";
    }
    const num = Number(val);
    if (num < min) {
      return `Minimum quantity is ${min}.`;
    }
    if (typeof max === "number" && num > max) {
      return `Maximum quantity is ${max}.`;
    }
    return "";
  };

  return (
    <>
      <div className={`modal-wishlist-block h-full`} onClick={closeModalCart}>
        <div
          className={`modal-wishlist-main py-0 ${isModalOpen ? "open" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="right cart-block relative flex h-full w-full flex-col overflow-hidden py-6">
            <div className="heading relative flex items-center justify-between px-6 pb-3">
              <div className="heading5">Shopping Cart ({cartState.length})</div>
              <div
                className="close-btn bg-surface absolute right-6 top-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full duration-300 hover:bg-black hover:bg-black/75 hover:text-white"
                onClick={closeModalCart}
              >
                <X size={14} />
              </div>
            </div>

            <div className="flex flex-grow flex-col">
              <div
                className="list-product max-h-full overflow-y-auto px-6 pb-10 md:max-h-[400px] lg:max-h-[480px]"
                style={{
                  maxHeight: "calc(100vh - 260px)",
                }}
              >
                {cartState.length === 0 ? (
                  <div className="flex h-40 items-center justify-center text-gray-500">
                    Your cart is empty
                  </div>
                ) : (
                  <>
                    {cartState.map((item) => {
                      const min = item.minQuantity ?? 1;
                      const max = item.maxQuantity;
                      const step = item.quantityStep ?? 1;
                      const inputState = inputStates[item.id] ?? {
                        value: String(item.quantity),
                        error: "",
                      };
                      return (
                        <div
                          key={item.id}
                          className="group relative mb-4 flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-gray-200 hover:shadow-md"
                        >
                          <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-gray-50">
                            <CartProductItem item={item} />
                          </div>
                          <div className="flex flex-1 flex-col">
                            <div className="flex justify-between">
                              <h4 className="mb-1 text-sm font-medium text-gray-900">
                                {item.name}
                              </h4>
                              <button
                                className="text-gray-400 transition-colors hover:text-red-500"
                                onClick={() => removeFromCart(item.id)}
                                aria-label="Remove item"
                              >
                                <Trash size={18} />
                              </button>
                            </div>
                            <div className="mb-2 text-xs text-gray-500">
                              SKU: {item.sku}
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 transition-colors hover:border-gray-500 disabled:opacity-50"
                                    onClick={() => {
                                      const current =
                                        Number(inputState.value) || min;
                                      const next = Math.max(
                                        current - step,
                                        min,
                                      );
                                      setInputStates((prev) => ({
                                        ...prev,
                                        [item.id]: {
                                          value: String(next),
                                          error: "",
                                        },
                                      }));
                                      updateCart(item.id, next);
                                    }}
                                    disabled={Number(inputState.value) === min}
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <input
                                    type="text"
                                    className="w-14 border-none bg-transparent text-center text-sm font-medium outline-none"
                                    min={min}
                                    max={max}
                                    step={step}
                                    value={inputState.value}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const error = validateQuantity(
                                        val,
                                        min,
                                        max,
                                      );
                                      setInputStates((prev) => ({
                                        ...prev,
                                        [item.id]: {
                                          value: val,
                                          error,
                                        },
                                      }));
                                      // Only update cart if valid
                                      if (!error) {
                                        updateCart(item.id, Number(val));
                                      }
                                    }}
                                    onBlur={() => {
                                      const val = inputState.value;
                                      const error = validateQuantity(
                                        val,
                                        min,
                                        max,
                                      );
                                      setInputStates((prev) => ({
                                        ...prev,
                                        [item.id]: {
                                          value: val,
                                          error,
                                        },
                                      }));
                                      if (!error) {
                                        updateCart(item.id, Number(val));
                                      }
                                    }}
                                  />
                                  <button
                                    className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 transition-colors hover:border-gray-500"
                                    onClick={() => {
                                      const current =
                                        Number(inputState.value) || min;
                                      const next =
                                        max !== undefined
                                          ? Math.min(current + step, max)
                                          : current + step;
                                      setInputStates((prev) => ({
                                        ...prev,
                                        [item.id]: {
                                          value: String(next),
                                          error: "",
                                        },
                                      }));
                                      updateCart(item.id, next);
                                    }}
                                    disabled={
                                      max !== undefined &&
                                      Number(inputState.value) === max
                                    }
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                                <span className="text-xs text-gray-500">×</span>
                                <span className="discounted-price text-sm font-medium">
                                  ৳
                                  {(item.discountedPrice ?? item.price).toFixed(
                                    2,
                                  )}
                                </span>
                              </div>
                              <span className="font-medium text-black">
                                {formatPrice(
                                  (item.discountedPrice ?? item.price) *
                                    item.quantity,
                                )}
                              </span>
                            </div>
                            {inputState.error && (
                              <div className="mt-1 text-xs text-red-500">
                                {inputState.error}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
            <div className="footer-modal absolute bottom-0 left-0 mt-5 w-full border-t border-[#ddd] bg-white p-6 text-center focus:border-[#ddd]">
              <div className="flex flex-col gap-2 px-6 pt-0">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Items ({cartState.length})</span>
                  <span>{formatPrice(totalCart)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="heading5">Total</div>
                  <div className="heading5 text-xl">
                    {formatPrice(totalCart)}
                  </div>
                </div>
              </div>
              <div className="block-button px-6 py-3 text-center">
                <div className="flex items-center gap-4">
                  <Link
                    href={"/cart"}
                    className="duration-400 md:text-md inline-block basis-1/2 cursor-pointer rounded-[.25rem] border border-black bg-white px-10 py-4 text-center text-sm font-semibold uppercase leading-5 text-black transition-all ease-in-out hover:bg-black hover:bg-black/75 hover:text-white md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4"
                    onClick={closeModalCart}
                  >
                    View cart
                  </Link>
                  <Link
                    href={"/checkout"}
                    className="duration-400 md:text-md hover:bg-black/75/75 hover:bg-green inline-block basis-1/2 cursor-pointer rounded-[.25rem] bg-black px-10 py-4 text-center text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black hover:bg-black/75 hover:text-white md:rounded-[8px] md:px-4 md:py-2.5 md:leading-4 lg:rounded-[10px] lg:px-7 lg:py-4"
                    onClick={(e) => {
                      if (typeof window !== "undefined") {
                        window.sessionStorage.removeItem("buyNowProduct");
                      }
                      if (pathname === "/checkout") {
                        e.preventDefault();
                        if (typeof window !== "undefined") {
                          window.location.reload();
                        }
                        return;
                      }
                      closeModalCart();
                    }}
                  >
                    Check Out
                  </Link>
                </div>
                {/* <Link
                  href={"/products"}
                  onClick={closeModalCart}
                  className="has-line-before mt-4 inline-block cursor-pointer text-center text-sm font-semibold uppercase leading-5 md:text-xs md:leading-4"
                >
                  Or continue shopping
                </Link> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalCart;
