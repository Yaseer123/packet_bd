import { formatDistanceToNow } from "date-fns";

export const formatTimeAgo = (date: Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Formats a price with commas for thousands separators and proper decimal places
 * @param price - The price to format
 * @param currency - The currency symbol (default: "৳")
 * @param showDecimals - Whether to show decimal places (default: false)
 * @returns Formatted price string
 */
export const formatPrice = (
  price: number | undefined | null,
  currency = "৳",
  showDecimals = false,
): string => {
  if (price === undefined || price === null || isNaN(Number(price))) {
    return `${currency}0`;
  }
  if (price === 0) {
    return `${currency}0`;
  }

  // Format with commas for thousands separators
  const formattedNumber = price.toLocaleString("en-US", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  return `${currency}${formattedNumber}`;
};
