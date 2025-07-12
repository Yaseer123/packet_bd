"use client";
import { useCartStore } from "@/context/store-context/CartContext";
import { Minus, Plus, XCircle } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "../../../utils/format";

const Cart = () => {
  const router = useRouter();

  const { cartArray, updateCart, removeFromCart } = useCartStore();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const itemToUpdate = cartArray.find((item) => item.id === productId);

    if (itemToUpdate) {
      updateCart(productId, newQuantity);
    }
  };

  const [totalCart, setTotalCart] = useState<number>(0);
  const [discountCart] = useState<number>(0);
  const [shipCart] = useState<number>(30);

  useEffect(() => {
    const total = cartArray.reduce(
      (sum, item) => sum + (item.discountedPrice ?? item.price) * item.quantity,
      0,
    );
    setTotalCart(total);
  }, [cartArray]);

  const redirectToCheckout = () => {
    router.push(`/checkout?discount=${discountCart}&ship=${shipCart}`);
  };

  return (
    <>
      <div id="header" className="relative w-full">
        {/* <Breadcrumb pageTitle="Shopping cart" subHeading="Shopping cart" /> */}
      </div>
      <div className="py-10 md:py-20">
        <div className="mx-auto w-full !max-w-[1322px] px-2 sm:px-4">
          <div className="flex flex-col justify-between gap-y-8 xl:flex-row xl:gap-x-8">
            <div className="w-full xl:w-2/3 xl:pr-3">
              <div className="mt-5 w-full overflow-x-auto sm:mt-7">
                <div className="w-full min-w-[340px]">
                  <div className="heading bg-surface hidden pb-4 pt-4 md:block">
                    <div className="flex">
                      <div className="w-1/2">
                        <div className="text-center text-base font-semibold capitalize leading-[26px]">
                          Products
                        </div>
                      </div>
                      <div className="w-1/12">
                        <div className="text-center text-base font-semibold capitalize leading-[26px]">
                          Price
                        </div>
                      </div>
                      <div className="w-1/6">
                        <div className="text-center text-base font-semibold capitalize leading-[26px]">
                          Quantity
                        </div>
                      </div>
                      <div className="w-1/6">
                        <div className="text-center text-base font-semibold capitalize leading-[26px]">
                          Total Price
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 w-full">
                    {cartArray.length < 1 ? (
                      <p className="pt-3 text-base font-semibold capitalize leading-[26px]">
                        No product in cart
                      </p>
                    ) : (
                      cartArray.map((product) => (
                        <div
                          className="mt-5 flex w-full flex-col gap-4 border-b border-[#ddd] pb-5 focus:border-[#ddd] md:mt-7 md:flex-row md:gap-0 md:pb-7"
                          key={product.id}
                        >
                          {/* Product Image & Name */}
                          <div className="flex w-full items-center gap-4 md:w-1/2 md:gap-6">
                            <div className="bg-img aspect-square w-20 flex-shrink-0 md:w-[100px]">
                              <Image
                                src={
                                  product.coverImage ??
                                  "/images/product/1000x1000.png"
                                }
                                width={100}
                                height={100}
                                sizes="(max-width: 640px) 80px, (max-width: 1024px) 100px, 100px"
                                alt={product.name}
                                className="h-full w-full rounded-lg object-contain"
                              />
                            </div>
                            <div>
                              <div className="text-base font-medium capitalize leading-6 md:text-base md:leading-5">
                                {product.name}
                              </div>
                              <div className="list-select mt-3"></div>
                            </div>
                          </div>
                          {/* Price (mobile: label above) */}
                          <div className="flex w-full items-center justify-between md:w-1/12 md:justify-center">
                            <span className="block text-xs text-gray-500 md:hidden">
                              Price
                            </span>
                            <div className="discounted-price text-center text-base font-medium capitalize leading-6 md:text-base md:leading-5">
                              {formatPrice(
                                product.discountedPrice ?? product.price,
                              )}
                            </div>
                          </div>
                          {/* Quantity (mobile: label above) */}
                          <div className="mt-2 flex w-full items-center justify-between md:mt-0 md:w-1/6 md:justify-center">
                            <span className="block text-xs text-gray-500 md:hidden">
                              Quantity
                            </span>
                            <div className="quantity-block bg-surface flex w-24 flex-shrink-0 items-center justify-between rounded-lg border border-[#ddd] p-2 focus:border-[#ddd] md:w-20 md:p-3">
                              <Minus
                                onClick={() => {
                                  if (product.quantity > 1) {
                                    handleQuantityChange(
                                      product.id,
                                      product.quantity - 1,
                                    );
                                  }
                                }}
                                className={`cursor-pointer text-base disabled:pointer-events-none disabled:text-secondary max-md:text-sm ${product.quantity === 1 ? "disabled" : ""}`}
                              />
                              <div className="quantity text-base font-semibold capitalize leading-[26px] md:text-base md:leading-6">
                                {product.quantity}
                              </div>
                              <Plus
                                onClick={() =>
                                  handleQuantityChange(
                                    product.id,
                                    product.quantity + 1,
                                  )
                                }
                                className="cursor-pointer text-base disabled:pointer-events-none disabled:text-secondary max-md:text-sm"
                              />
                            </div>
                          </div>
                          {/* Total Price (mobile: label above) */}
                          <div className="total-price mt-2 flex w-full items-center justify-between md:mt-0 md:w-1/6 md:justify-center">
                            <span className="block text-xs text-gray-500 md:hidden">
                              Total
                            </span>
                            <div className="text-center text-base font-medium capitalize leading-6 md:text-base md:leading-5">
                              {formatPrice(
                                product.quantity *
                                  (product.discountedPrice ?? product.price),
                              )}
                            </div>
                          </div>
                          {/* Remove button (mobile: right-aligned) */}
                          <div className="mt-2 flex w-full items-center justify-end md:mt-0 md:w-1/12 md:justify-center">
                            <XCircle
                              className="cursor-pointer text-xl text-red-500 duration-500 max-md:text-base"
                              onClick={() => {
                                removeFromCart(product.id);
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              {/* <div className="mt-5 h-12 w-full sm:mt-7">
                <form className="relative h-full w-full">
                  <input
                    type="text"
                    placeholder="Add voucher discount"
                    className="bg-surface h-full w-full rounded-lg border border-[#ddd] pl-4 pr-14 focus:border-[#ddd]"
                    required
                  />
                  <button
                    onClick={() => null}
                    className="duration-400 hover:bg-green absolute bottom-1 right-1 top-1 flex cursor-pointer items-center justify-center rounded-lg bg-black px-5 py-4 text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black/75 md:rounded-[8px] md:px-4 md:py-2.5 md:text-xs md:leading-4 lg:rounded-[10px] lg:px-6 lg:py-3"
                  >
                    Apply Code
                  </button>
                </form>
              </div> */}
              {/* <div className="mt-5 flex flex-wrap items-center gap-5 sm:mt-7">
                <div
                  className={`transition-all duration-300 ease-in-out ${applyCode === 200 ? "border-green bg-green" : ""} rounded-lg border border-[#ddd] py-2 focus:border-[#ddd]`}
                >
                  <div className="list-voucher-item-top relative flex justify-between gap-10 border-b border-dashed border-[#ddd] px-3 pb-2 focus:border-[#ddd]">
                    <div className="left">
                      <div className="text-base font-normal leading-[22] md:text-[13px] md:leading-5">
                        Discount
                      </div>
                      <div className="text-base font-bold leading-[22] md:text-[13px] md:leading-5">
                        10% OFF
                      </div>
                    </div>
                    <div className="right">
                      <div className="text-base font-normal leading-[22] md:text-[13px] md:leading-5">
                        For all orders <br />
                        from 200৳
                      </div>
                    </div>
                  </div>
                  <div className="bottom flex items-center justify-between gap-6 px-3 pt-2">
                    <div className="text-sm font-semibold uppercase leading-5 md:text-xs md:leading-4">
                      Code: AN6810
                    </div>
                    <div
                      className="duration-400 hover:bg-green inline-block cursor-pointer rounded-[.25rem] bg-black px-2.5 py-1 text-xs font-semibold capitalize leading-5 text-white transition-all ease-in-out hover:bg-black/75 md:rounded-[8px] md:px-4 md:py-2.5 md:text-xs md:leading-4 lg:rounded-[10px] lg:px-6 lg:py-3"
                      onClick={() =>
                        handleApplyCode(200, Math.floor((totalCart / 100) * 10))
                      }
                    >
                      {applyCode === 200 ? "Applied" : "Apply Code"}
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
            <div className="w-full xl:w-1/3 xl:pl-12">
              <div className="bg-surface rounded-2xl p-6">
                <div className="text-[24px] font-semibold capitalize leading-[30px] md:text-base md:leading-[26px] lg:text-[22px] lg:leading-[28px]">
                  Order Summary
                </div>
                <div className="total-block flex justify-between border-b border-[#ddd] py-5 focus:border-[#ddd]">
                  <div className="text-base font-medium capitalize leading-6 md:text-base md:leading-5">
                    Subtotal
                  </div>
                  <div className="text-base font-medium capitalize leading-6 md:text-base md:leading-5">
                    {formatPrice(totalCart)}
                  </div>
                </div>

                <div className="flex justify-between pb-4 pt-4">
                  <div className="text-[24px] font-semibold capitalize leading-[30px] md:text-base md:leading-[26px] lg:text-[22px] lg:leading-[28px]">
                    Total
                  </div>
                  <div className="text-[24px] font-semibold capitalize leading-[30px] md:text-base md:leading-[26px] lg:text-[22px] lg:leading-[28px]">
                    {formatPrice(totalCart - discountCart + shipCart)}
                  </div>
                </div>
                <div className="block-button mt-5 flex flex-col items-center gap-y-4">
                  <div
                    className="duration-400 text-md hover:bg-green inline-block w-full cursor-pointer rounded-[.25rem] bg-black px-10 py-4 text-center font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black/75 md:rounded-[8px] md:px-4 md:py-2.5 md:text-[15px] md:leading-4 lg:rounded-[10px] lg:px-6 lg:py-5"
                    onClick={redirectToCheckout}
                  >
                    Process To Checkout
                  </div>
                  <Link
                    className="text-base font-semibold capitalize leading-[26px] hover:underline md:text-base md:leading-6"
                    href={"/products"}
                  >
                    Continue shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
