"use client";
import Breadcrumb from "@/components/store-components/Breadcrumb/Breadcrumb";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore } from "@/context/store-context/CartContext";
import { api } from "@/trpc/react";
import { Minus, Plus } from "@phosphor-icons/react/dist/ssr";
import type { Order } from "@prisma/client";
import { HomeIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatPrice } from "../../../utils/format";

// Add import for TRPC
import type { ProductWithCategory } from "@/types/ProductType";
import { useQueries } from "@tanstack/react-query";
// Remove: import { useTRPCContext } from "@trpc/react-query";

type OrderWithRelations = Order & {
  address?: {
    name: string;
    id: string;
    userId: string | null;
    email: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    isDefault: boolean;
  } | null;
  items?: Array<{
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      title: string;
      // add other product fields as needed
    } | null;
  }>;
};

type OrderSuccessType = Order | OrderWithRelations | null;

type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  discountedPrice?: number;
  quantity: number;
  coverImage?: string;
  sku?: string;
  color?: string;
  colorName?: string;
  size?: string;
  minQuantity: number;
  maxQuantity?: number;
  quantityStep: number;
  variantLabel?: string; // <-- add this line
  // add other fields as needed
};

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
      if (Array.isArray(parsed)) {
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
  const matched = normalized.find(
    (d) => quantity >= d.minQty && quantity <= d.maxQty,
  );
  if (matched) {
    return basePrice - (basePrice * matched.discountPercent) / 100;
  }
  return basePrice;
}

// Helper to normalize quantityDiscounts to always be an array of the correct type
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

const Checkout = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Autofill: fetch user address if logged in
  const { data: fetchedAddress } = api.address.getAddress.useQuery(undefined, {
    enabled: !!session,
  });

  const searchParams = useSearchParams();
  const discount = searchParams?.get("discount") ?? "0";

  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const { cartArray, note, setNote, updateCart, removeFromCart } =
    useCartStore() as {
      cartArray: CartItem[];
      note: string;
      setNote: (note: string) => void;
      updateCart: (itemId: string, quantity: number) => void;
      removeFromCart: (itemId: string) => void;
    };
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccessType>(null);
  const [orderError, setOrderError] = useState("");

  // Buy Now support
  const [buyNowProduct, setBuyNowProduct] = useState<CartItem | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const buyNow = window.sessionStorage.getItem("buyNowProduct");
      if (buyNow) {
        setBuyNowProduct(JSON.parse(buyNow) as CartItem);
      }
    }
  }, []);

  // Use buyNowProduct if present, else cartArray
  const checkoutItems = useMemo(
    () => (buyNowProduct ? [buyNowProduct] : cartArray),
    [buyNowProduct, cartArray],
  );

  const utils = api.useUtils();
  // --- Fetch product data for all cart items ---
  const uniqueProductIds = useMemo(
    () =>
      Array.from(new Set((checkoutItems ?? []).map((item) => item.productId))),
    [checkoutItems],
  );

  // Fetch all products in parallel using useQueries
  const productQueries = useQueries({
    queries: (uniqueProductIds ?? []).map((id) => ({
      queryKey: ["product", id],
      queryFn: () => utils.product.getProductById.fetch({ id }),
      enabled: !!id,
    })),
  });

  // Build a map of productId -> productData
  const productMap = useMemo(() => {
    const map: Record<string, ProductWithCategory | undefined> = {};
    (uniqueProductIds ?? []).forEach((id, idx) => {
      const data = productQueries?.[idx]?.data;
      if (data) {
        map[id] = data as ProductWithCategory;
      }
    });
    return map;
  }, [productQueries, uniqueProductIds]);

  // --- Calculate total using quantity-based discounts ---
  const [totalCart, setTotalCart] = useState<number>(0);
  useEffect(() => {
    let sum = 0;
    for (const item of checkoutItems) {
      const product = productMap[item.productId];
      // Use discountedPrice if available, else price
      const unit =
        product && typeof product.discountedPrice === "number"
          ? product.discountedPrice
          : typeof product?.discountedPrice === "undefined" &&
              typeof item.discountedPrice === "number"
            ? item.discountedPrice
            : item.price;
      const discountsArr = normalizeQuantityDiscounts(
        product?.quantityDiscounts,
      );
      const discountPercent = (() => {
        if (!discountsArr.length) return 0;
        const match = discountsArr.find(
          (d) => item.quantity >= d.minQty && item.quantity <= d.maxQty,
        );
        return match ? match.discountPercent : 0;
      })();
      sum +=
        getDiscountedUnitPrice(
          item.quantity,
          unit,
          product?.quantityDiscounts,
        ) * item.quantity;
    }
    setTotalCart(sum);
  }, [checkoutItems, productMap]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    // Find the product to get min/max/step
    const product = checkoutItems.find((item) => item.id === itemId);
    if (!product) return;

    const min = product.minQuantity ?? 1;
    const max = product.maxQuantity;
    let quantity = Math.max(newQuantity, min);
    if (max !== undefined) quantity = Math.min(quantity, max);

    if (buyNowProduct && buyNowProduct.id === itemId) {
      if (quantity > 0) {
        setBuyNowProduct({ ...buyNowProduct, quantity });
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "buyNowProduct",
            JSON.stringify({ ...buyNowProduct, quantity }),
          );
        }
      } else {
        setBuyNowProduct(null);
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("buyNowProduct");
        }
      }
    } else {
      if (quantity > 0) {
        updateCart(itemId, quantity);
      } else {
        removeFromCart(itemId);
      }
    }
  };

  const [newAddress, setNewAddress] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
  });
  const [addressErrors, setAddressErrors] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
  });

  // Autofill effect: only if user is logged in, fetchedAddress exists, and form is empty
  useEffect(() => {
    if (
      session &&
      fetchedAddress &&
      !newAddress.name &&
      !newAddress.email &&
      !newAddress.mobile &&
      !newAddress.address
    ) {
      setNewAddress({
        name: fetchedAddress.name || "",
        email: fetchedAddress.email || "",
        mobile: fetchedAddress.phone || "",
        address: fetchedAddress.street || "",
      });
    }
  }, [
    session,
    fetchedAddress,
    newAddress.name,
    newAddress.email,
    newAddress.mobile,
    newAddress.address,
  ]);

  const createAddressMutation = api.address.createAddress.useMutation();
  const createGuestAddressMutation =
    api.address.createGuestAddress.useMutation();

  const placeGuestOrder = api.order.placeGuestOrder.useMutation({
    onSuccess: (data: SetStateAction<OrderSuccessType>) => {
      setOrderSuccess(data);
      setOrderError("");
      useCartStore.getState().clearCart();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("buyNowProduct");
      }
    },
    onError: (err: { message: string }) => {
      setOrderError(err.message ?? "Order failed. Please try again.");
    },
  });

  // Coupon code state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");
  const [discountValue, setDiscountValue] = useState<number>(Number(discount));

  const validateCouponMutation =
    api.coupon.validateNewsletterCoupon.useMutation();

  // Restore deliveryMethod state
  const [deliveryMethod, setDeliveryMethod] = useState<
    "home" | "pickup" | "express"
  >("home");
  const [shippingArea, setShippingArea] = useState<"inside" | "outside">(
    "inside",
  );
  // Calculate home delivery cost based on area
  const homeDeliveryCost = shippingArea === "inside" ? 80 : 120;
  const [shippingCost, setShippingCost] = useState<number>(homeDeliveryCost);

  // Update shipping cost based on delivery method and shipping area
  useEffect(() => {
    if (deliveryMethod === "home") {
      setShippingCost(homeDeliveryCost);
    } else {
      setShippingCost(0);
    }
  }, [deliveryMethod, shippingArea, homeDeliveryCost]);

  // Per-item state for input value and error
  const [inputStates, setInputStates] = useState<
    Record<string, { value: string; error: string }>
  >({});

  // Sync input state with checkoutItems (initialize on mount or checkoutItems change)
  useEffect(() => {
    const newStates: Record<string, { value: string; error: string }> = {};
    checkoutItems.forEach((item) => {
      newStates[item.id] = {
        value: String(item.quantity),
        error: "",
      };
    });
    setInputStates(newStates);
  }, [checkoutItems]);

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

  const breadcrumbItems = [
    {
      label: <HomeIcon size={16} />,
      href: "/",
    },
    {
      label: "Checkout",
    },
  ];

  const validateField = (field: string, value: string) => {
    switch (field) {
      case "name":
        return value.trim() === "" ? "Full Name is required" : "";
      case "email":
        return value.trim() === ""
          ? "Email is required"
          : !/^\S+@\S+\.\S+$/.test(value)
            ? "Invalid email address"
            : "";
      case "mobile":
        return value.trim() === ""
          ? "Mobile number is required"
          : !/^\+?\d{7,15}$/.test(value)
            ? "Invalid mobile number"
            : "";
      case "address":
        return value.trim() === "" ? "Address is required" : "";
      default:
        return "";
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
    setAddressErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value),
    }));
  };

  // Coupon apply handler
  const handleApplyCoupon = async () => {
    if (!newAddress.email || !/^\S+@\S+\.\S+$/.test(newAddress.email)) {
      setCouponError(
        "Please enter a valid email address above before applying the coupon.",
      );
      return;
    }
    setCouponError("");
    setAppliedCoupon(null);
    setDiscountValue(0);
    try {
      const res = await validateCouponMutation.mutateAsync({
        email: newAddress.email,
        couponCode: couponCode,
      });
      if (res.valid) {
        const discount = Math.round(totalCart * (res.discount ?? 0));
        setDiscountValue(discount);
        setAppliedCoupon(couponCode);
        setCouponError("");
      } else {
        setCouponError(res.message ?? "Invalid or expired coupon code.");
        setAppliedCoupon(null);
        setDiscountValue(0);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCouponError(
          err.message ?? "Something went wrong. Please try again.",
        );
      } else {
        setCouponError("Something went wrong. Please try again.");
      }
      setAppliedCoupon(null);
      setDiscountValue(0);
    }
  };

  const renderAddressSection = () => (
    <div className="mt-5">
      {!session && (
        <div className="bg-surface mb-4 flex justify-between rounded-lg py-3">
          <div className="flex items-center">
            <span className="pr-4">Already have an account? </span>
            <Link
              href="/login"
              className="cursor-pointer text-base font-semibold capitalize leading-[26px] hover:underline md:text-base md:leading-6"
            >
              Login
            </Link>
          </div>
        </div>
      )}
      <div className="mb-2 flex items-center">
        <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-100 font-bold text-red-500">
          1
        </span>
        <span className="text-xl font-semibold">Shipping Information</span>
      </div>
      <hr className="mb-4" />
      {/* Shipping Area Selection - always visible */}
      <div className="mb-4">
        <div className="mb-1 font-medium">Select Shipping Area</div>
        <RadioGroup
          value={shippingArea}
          onValueChange={(val) => setShippingArea(val as "inside" | "outside")}
          className="flex flex-row gap-4"
        >
          <label className="flex cursor-pointer items-center gap-2">
            <RadioGroupItem value="inside" id="shipping-inside" />
            <span>Inside Dhaka - 80৳</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <RadioGroupItem value="outside" id="shipping-outside" />
            <span>Outside Dhaka - 120৳</span>
          </label>
        </RadioGroup>
      </div>
      <div className="mt-5">
        <form>
          <div className="grid flex-wrap gap-4 gap-y-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <input
                ref={nameInputRef}
                className="w-full rounded-lg border-[#ddd] px-4 py-3 focus:border-[#ddd]"
                id="name"
                type="text"
                placeholder="Full Name *"
                value={newAddress.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
              {addressErrors.name && (
                <div className="mt-1 text-xs text-red-500">
                  {addressErrors.name}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <input
                ref={emailInputRef}
                className="w-full rounded-lg border-[#ddd] px-4 py-3 focus:border-[#ddd]"
                id="email"
                type="email"
                placeholder="Email Address *"
                value={newAddress.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
              {addressErrors.email && (
                <div className="mt-1 text-xs text-red-500">
                  {addressErrors.email}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <input
                ref={mobileInputRef}
                className="w-full rounded-lg border-[#ddd] px-4 py-3 focus:border-[#ddd]"
                id="mobile"
                type="text"
                placeholder="Mobile Number *"
                value={newAddress.mobile}
                onChange={(e) => handleInputChange("mobile", e.target.value)}
                required
              />
              {addressErrors.mobile && (
                <div className="mt-1 text-xs text-red-500">
                  {addressErrors.mobile}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <input
                ref={addressInputRef}
                className="w-full rounded-lg border-[#ddd] px-4 py-3 focus:border-[#ddd]"
                id="address"
                type="text"
                placeholder="Address *"
                value={newAddress.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                required
              />
              {addressErrors.address && (
                <div className="mt-1 text-xs text-red-500">
                  {addressErrors.address}
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="mt-4">
          <label htmlFor="additional-notes" className="mb-1 block font-medium">
            Additional Notes (optional)
          </label>
          <textarea
            id="additional-notes"
            className="w-full rounded-lg border-[#ddd] px-4 py-2 focus:border-[#ddd]"
            placeholder="Any special instructions or notes for your order?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderDeliveryMethodSection = () => (
    <div className="mb-8 mt-8">
      <div className="mb-2 flex items-center">
        <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-100 font-bold text-red-500">
          3
        </span>
        <span className="text-xl font-semibold">Delivery Method</span>
      </div>
      <hr className="mb-4" />
      <div className="mb-2 font-medium">Select a delivery method</div>
      <RadioGroup
        value={deliveryMethod}
        onValueChange={(val) =>
          setDeliveryMethod(val as "home" | "pickup" | "express")
        }
        className="flex flex-col gap-2"
      >
        <label className="flex cursor-pointer items-center gap-2">
          <RadioGroupItem value="home" id="delivery-home" />
          <span>
            Home Delivery - {homeDeliveryCost}৳ (
            {shippingArea === "inside" ? "Inside Dhaka" : "Outside Dhaka"})
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <RadioGroupItem value="pickup" id="delivery-pickup" />
          <span>Store Pickup - 0৳</span>
        </label>
        {/* <label className="flex cursor-pointer items-center gap-2">
          <RadioGroupItem value="express" id="delivery-express" />
          <span>Request Express - Charge Applicable</span>
        </label> */}
      </RadioGroup>
    </div>
  );

  const renderPaymentSection = () => (
    <div className="mt-6 md:mt-10">
      <div className="text-[24px] font-semibold capitalize leading-[30px] md:text-base md:leading-[26px] lg:text-[22px] lg:leading-[28px]">
        <span className="mb-2 mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-100 font-bold text-red-500">
          2
        </span>
        Choose payment Option:
      </div>
      <hr className="mb-4" />
      <div className="mt-5 bg-white">
        <div
          className={`bg-surface rounded-lg border border-[#ddd] p-5 focus:border-[#ddd]`}
        >
          <RadioGroup value="delivery">
            <label className="flex cursor-pointer items-center">
              <RadioGroupItem value="delivery" id="delivery" />
              <span className="cursor-pointer pl-2 text-base font-semibold capitalize leading-[26px] md:text-base md:leading-6">
                Cash on delivery
              </span>
            </label>
          </RadioGroup>
          <div className="visible max-h-[1000px] opacity-100">
            <div className="pt-4">
              You will pay in cash when your order is delivered to your address.
              Please ensure your shipping information is correct.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const placeOrder = api.order.placeOrder.useMutation({
    onSuccess: (data: OrderSuccessType) => {
      setOrderSuccess(data);
      setOrderError("");
      useCartStore.getState().clearCart();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("buyNowProduct");
      }
    },
    onError: (err: { message: string }) => {
      setOrderError(err.message ?? "Order failed. Please try again.");
    },
  });

  const handlePlaceOrder = async () => {
    if (checkoutItems.length === 0) {
      setOrderError("Your cart is empty.");
      return;
    }
    let addressId = undefined;
    try {
      if (session) {
        const created = await createAddressMutation.mutateAsync({
          name: newAddress.name,
          email: newAddress.email,
          phone: newAddress.mobile,
          street: newAddress.address,
          city: "",
          state: "",
          zipCode: "",
        });
        addressId = created.id;
      } else {
        const created = await createGuestAddressMutation.mutateAsync({
          name: newAddress.name,
          email: newAddress.email,
          phone: newAddress.mobile,
          street: newAddress.address,
          city: "",
          state: "",
          zipCode: "",
        });
        addressId = created.id;
      }
    } catch (error) {
      console.error("Failed to save address:", error);
      if (error instanceof Error) {
        try {
          const parsedErrors = JSON.parse(error.message) as {
            path: (string | number)[];
            message: string;
          }[];

          if (
            Array.isArray(parsedErrors) &&
            parsedErrors.length > 0 &&
            parsedErrors[0]?.path &&
            parsedErrors[0]?.message
          ) {
            const field = parsedErrors[0].path[0];
            const message = parsedErrors[0].message;

            let clientField: keyof typeof addressErrors = "name";
            if (field === "name") clientField = "name";
            if (field === "email") clientField = "email";
            if (field === "phone") clientField = "mobile";
            if (field === "street") clientField = "address";

            setAddressErrors((prev) => ({
              ...prev,
              [clientField]: message,
            }));

            if (clientField === "name") nameInputRef.current?.focus();
            if (clientField === "email") emailInputRef.current?.focus();
            if (clientField === "mobile") mobileInputRef.current?.focus();
            if (clientField === "address") addressInputRef.current?.focus();
          } else {
            setOrderError(error.message);
          }
        } catch (e) {
          setOrderError(error.message);
        }
      } else {
        setOrderError("An unknown error occurred. Please try again.");
      }
      return;
    }
    if (!addressId) {
      setOrderError("No address found. Please enter your address.");
      return;
    }
    if (session) {
      placeOrder.mutate({
        cartItems: checkoutItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          color: item.colorName ?? item.color,
          size: item.size,
          sku: item.sku,
          deliveryMethod: deliveryMethod, // Use deliveryMethod for deliveryMethod
          variantLabel: item.variantLabel, // <-- add this line
          price: (() => {
            // Use the same logic as the displayed price
            const product = productMap[item.productId];
            const unit =
              product && typeof product.discountedPrice === "number"
                ? product.discountedPrice
                : typeof product?.discountedPrice === "undefined" &&
                    typeof item.discountedPrice === "number"
                  ? item.discountedPrice
                  : item.price;
            const discountsArr = normalizeQuantityDiscounts(
              product?.quantityDiscounts,
            );
            const discountPercent = (() => {
              if (!discountsArr.length) return 0;
              const match = discountsArr.find(
                (d) => item.quantity >= d.minQty && item.quantity <= d.maxQty,
              );
              return match ? match.discountPercent : 0;
            })();
            return getDiscountedUnitPrice(
              item.quantity,
              unit,
              product?.quantityDiscounts,
            );
          })(),
        })),
        addressId,
        notes: note,
        shippingCost,
      });
    } else {
      placeGuestOrder.mutate({
        cartItems: checkoutItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          color: item.colorName ?? item.color,
          size: item.size,
          sku: item.sku,
          deliveryMethod: deliveryMethod, // Use deliveryMethod for deliveryMethod
          variantLabel: item.variantLabel, // <-- add this line
          price: (() => {
            // Use the same logic as the displayed price
            const product = productMap[item.productId];
            const unit =
              product && typeof product.discountedPrice === "number"
                ? product.discountedPrice
                : typeof product?.discountedPrice === "undefined" &&
                    typeof item.discountedPrice === "number"
                  ? item.discountedPrice
                  : item.price;
            const discountsArr = normalizeQuantityDiscounts(
              product?.quantityDiscounts,
            );
            const discountPercent = (() => {
              if (!discountsArr.length) return 0;
              const match = discountsArr.find(
                (d) => item.quantity >= d.minQty && item.quantity <= d.maxQty,
              );
              return match ? match.discountPercent : 0;
            })();
            return getDiscountedUnitPrice(
              item.quantity,
              unit,
              product?.quantityDiscounts,
            );
          })(),
        })),
        addressId,
        notes: note,
        shippingCost,
      });
      // Auto-register guest user after order
      await fetch("/api/auth/auto-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAddress.email,
          name: newAddress.name,
        }),
      });
    }
  };

  const paymentAndOrderSection = (
    <>
      {renderPaymentSection()}
      {renderDeliveryMethodSection()}

      <div className="mt-6 md:mt-10">
        <button
          className="duration-400 hover:bg-green inline-block w-full cursor-pointer rounded-[.25rem] bg-black px-10 py-4 text-sm font-semibold uppercase leading-5 text-white transition-all ease-in-out hover:bg-black/75 md:rounded-[8px] md:px-4 md:py-2.5 md:text-xs md:leading-4 lg:rounded-[10px] lg:px-6 lg:py-3"
          onClick={handlePlaceOrder}
        >
          Order Now
        </button>
        {orderError && <div className="mt-2 text-red-500">{orderError}</div>}
      </div>
    </>
  );

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (orderSuccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white">
        <h2 className="mb-4 text-2xl font-bold">Order Completed!</h2>
        <p className="mb-2">Thank you for your order.</p>
        <p className="mb-2">Your Invoice/Order Number:</p>
        <div className="mb-4 rounded bg-gray-100 px-4 py-2 font-mono text-lg">
          {orderSuccess.id}
        </div>
        <button
          className="mt-4 rounded bg-black px-6 py-2 text-white hover:bg-black/75"
          onClick={() => router.push("/my-account")}
        >
          Go to My Orders
        </button>
      </div>
    );
  }

  return (
    <>
      <div id="header" className="relative w-full">
        <Breadcrumb items={breadcrumbItems} pageTitle="Checkout" />
      </div>
      <div className="py-10 md:py-20">
        <div className="mx-auto w-full !max-w-[1322px] px-4">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:overflow-x-auto">
            <div className="w-full md:w-1/2">
              {renderAddressSection()}
              <div className="hidden md:block">{paymentAndOrderSection}</div>
            </div>
            <div className="right w-full md:w-5/12">
              <div>
                <div className="pb-3 text-[24px] font-semibold capitalize leading-[30px] md:text-base md:leading-[26px] lg:text-[22px] lg:leading-[28px]">
                  Your Order
                </div>
                {/* Coupon code input */}
                <div className="mb-4">
                  <label htmlFor="coupon" className="mb-1 block font-medium">
                    Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="coupon"
                      type="text"
                      className="w-full rounded-lg border-[#ddd] px-4 py-2 focus:border-[#ddd]"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={!!appliedCoupon}
                    />
                    <button
                      type="button"
                      className="hover:bg-green rounded bg-black px-4 py-2 font-semibold text-white hover:bg-black/75 disabled:opacity-50"
                      onClick={handleApplyCoupon}
                      disabled={!!appliedCoupon || !couponCode.trim()}
                    >
                      {appliedCoupon ? "Applied" : "Apply"}
                    </button>
                  </div>
                  {couponError && (
                    <div className="mt-1 text-xs text-red-500">
                      {couponError}
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="mt-1 text-xs text-green-600">
                      Coupon &apos;{appliedCoupon}&apos; applied!
                    </div>
                  )}
                </div>
                <div>
                  {checkoutItems.length < 1 ? (
                    <p className="pt-3 text-base font-semibold capitalize leading-[26px] md:text-base md:leading-6">
                      No product in cart
                    </p>
                  ) : (
                    checkoutItems.map((product) => {
                      const min = product.minQuantity ?? 1;
                      const max = product.maxQuantity;
                      const step = product.quantityStep ?? 1;
                      const inputState = inputStates[product.id] ?? {
                        value: String(product.quantity),
                        error: "",
                      };
                      const productData = productMap[product.productId];
                      // Use discountedPrice if available, else price
                      const baseUnitPrice =
                        typeof product.discountedPrice === "number"
                          ? product.discountedPrice
                          : typeof productData?.discountedPrice === "number"
                            ? productData.discountedPrice
                            : product.price;
                      const unit =
                        typeof product.discountedPrice === "number"
                          ? product.discountedPrice
                          : typeof product.discountedPrice === "undefined" &&
                              typeof product.discountedPrice === "number"
                            ? product.discountedPrice
                            : product.price;
                      const discountsArr = normalizeQuantityDiscounts(
                        productData?.quantityDiscounts,
                      );
                      const discountPercent = (() => {
                        if (!discountsArr.length) return 0;
                        const match = discountsArr.find(
                          (d) =>
                            product.quantity >= d.minQty &&
                            product.quantity <= d.maxQty,
                        );
                        return match ? match.discountPercent : 0;
                      })();
                      return (
                        <div
                          key={product.id}
                          className="mt-5 flex w-full items-start gap-4 border-b border-[#ddd] bg-white p-3 pb-5 focus:border-[#ddd]"
                        >
                          <div className="bg-img aspect-square w-[100px] flex-shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={
                                product.coverImage ??
                                "/images/product/1000x1000.png"
                              }
                              width={500}
                              height={500}
                              alt="img"
                              className="h-full w-full"
                            />
                          </div>
                          <div className="w-full">
                            <div className="flex w-full items-start justify-between gap-4">
                              <div className="text-base font-medium capitalize leading-6 md:text-base md:leading-5">
                                {product.name}
                              </div>
                              <div className="hidden text-right text-base font-medium capitalize leading-6 md:block md:text-base md:leading-5">
                                {formatPrice(unit)}
                                {discountPercent > 0 && (
                                  <span className="ml-2 text-xs text-green-600">
                                    ({discountPercent}% off)
                                  </span>
                                )}
                              </div>
                            </div>

                            {(product.sku ?? product.color ?? product.size) && (
                              <div className="mt-1 text-xs text-gray-500">
                                {product.sku && <span>SKU: {product.sku}</span>}
                                {(product.colorName ?? product.color) && (
                                  <span className="ml-2">
                                    Color: {product.colorName ?? product.color}
                                  </span>
                                )}
                                {product.size && (
                                  <span className="ml-2">
                                    {(product.variantLabel ?? "Size") + ": "}
                                    {product.size}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="mt-2 text-base font-medium capitalize leading-6 md:hidden md:text-base md:leading-5">
                              {formatPrice(unit)}
                              {discountPercent > 0 && (
                                <span className="ml-2 text-xs text-green-600">
                                  ({discountPercent}% off)
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                              <button
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                                onClick={() => {
                                  const current =
                                    Number(inputState.value) || min;
                                  const next = Math.max(current - step, min);
                                  setInputStates((prev) => ({
                                    ...prev,
                                    [product.id]: {
                                      value: String(next),
                                      error: "",
                                    },
                                  }));
                                  handleQuantityChange(product.id, next);
                                }}
                                disabled={Number(inputState.value) === min}
                              >
                                <Minus size={16} />
                              </button>
                              <input
                                type="text"
                                className="w-14 border-none bg-transparent text-center text-base font-medium outline-none"
                                min={min}
                                max={max}
                                step={step}
                                value={inputState.value}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const error = validateQuantity(val, min, max);
                                  setInputStates((prev) => ({
                                    ...prev,
                                    [product.id]: {
                                      value: val,
                                      error,
                                    },
                                  }));
                                  if (!error) {
                                    handleQuantityChange(
                                      product.id,
                                      Number(val),
                                    );
                                  }
                                }}
                                onBlur={() => {
                                  const val = inputState.value;
                                  const error = validateQuantity(val, min, max);
                                  setInputStates((prev) => ({
                                    ...prev,
                                    [product.id]: {
                                      value: val,
                                      error,
                                    },
                                  }));
                                  if (!error) {
                                    handleQuantityChange(
                                      product.id,
                                      Number(val),
                                    );
                                  }
                                }}
                              />
                              <button
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                                onClick={() => {
                                  const current =
                                    Number(inputState.value) || min;
                                  const next =
                                    max !== undefined
                                      ? Math.min(current + step, max)
                                      : current + step;
                                  setInputStates((prev) => ({
                                    ...prev,
                                    [product.id]: {
                                      value: String(next),
                                      error: "",
                                    },
                                  }));
                                  handleQuantityChange(product.id, next);
                                }}
                                disabled={
                                  max !== undefined &&
                                  Number(inputState.value) === max
                                }
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            {inputState.error && (
                              <div className="mt-1 text-xs text-red-500">
                                {inputState.error}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex justify-between border-b border-[#ddd] py-5 focus:border-[#ddd]">
                  <div className="text-base font-medium capitalize leading-6 md:text-base md:leading-5">
                    Discounts
                  </div>
                  <div className="text-base font-medium capitalize leading-6 md:text-base md:leading-5">
                    -{formatPrice(discountValue)}
                  </div>
                </div>
                <div className="flex justify-between border-b border-[#ddd] py-5 focus:border-[#ddd]">
                  <div className="text-base font-medium capitalize leading-6 md:text-base md:leading-5">
                    Shipping
                  </div>
                  <div className="text-base font-medium capitalize leading-6 md:text-base md:leading-5">
                    {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                  </div>
                </div>
                <div className="flex justify-between pt-5">
                  <div className="text-[24px] font-semibold capitalize leading-[30px] md:text-base md:leading-[26px] lg:text-[22px] lg:leading-[28px]">
                    Total
                  </div>
                  <div className="text-[24px] font-semibold capitalize leading-[30px] md:text-base md:leading-[26px] lg:text-[22px] lg:leading-[28px]">
                    {formatPrice(totalCart - discountValue + shippingCost)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="block w-full md:hidden">{paymentAndOrderSection}</div>
        </div>
      </div>
    </>
  );
};

export default Checkout;
