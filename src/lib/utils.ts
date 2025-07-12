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

export function generateSKU({
  categoryName,
  productId,
  color,
  size,
}: {
  categoryName?: string;
  productId: string;
  color?: string;
  size?: string;
}) {
  const prefix = getCategoryPrefix(categoryName);
  // Use last 6 chars of productId for brevity
  const idPart = productId.slice(-6).toUpperCase();
  let sku = `${prefix}-${idPart}`;
  if (color) sku += `-${color.replace(/\s+/g, "").toUpperCase()}`;
  if (size) sku += `-${size.replace(/\s+/g, "").toUpperCase()}`;
  return sku;
}
