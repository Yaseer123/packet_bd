import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCategoryPrefix(categoryName?: string) {
  if (!categoryName) return "XX";
  const mapping: Record<string, string> = {
    "Home Electrics": "HE",
    // Add more mappings as needed
  };
  if (categoryName in mapping) return mapping[categoryName];
  // Fallback: use first letter of each word, up to 3 letters
  return categoryName
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);
}

// Generate a unique product code for Meta catalog (e.g., 40612)
export function generateProductCode(): string {
  // Generate a 5-digit number (10000-99999)
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export function generateSKU({
  categoryName,
  productId,
  productCode,
  color,
  size,
}: {
  categoryName?: string;
  productId: string;
  productCode?: string;
  color?: string;
  size?: string;
}) {
  const prefix = getCategoryPrefix(categoryName);
  // Use productCode if available, otherwise use last 6 chars of productId
  const idPart = productCode ?? productId.slice(-6).toUpperCase();
  let sku = `${prefix}-${idPart}`;
  if (color) sku += `-${color.replace(/\s+/g, "").toUpperCase()}`;
  if (size) sku += `-${size.replace(/\s+/g, "").toUpperCase()}`;
  return sku;
}
