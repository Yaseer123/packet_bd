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
): string => {
  if (price === undefined || price === null || isNaN(Number(price))) {
    return `${currency}0`;
  }
  if (price === 0) {
    return `${currency}0`;
  }

  // Check if price has decimals
  const hasDecimals = price % 1 !== 0;
  const formattedNumber = price.toLocaleString("en-US", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  });

  return `${currency}${formattedNumber}`;
};
