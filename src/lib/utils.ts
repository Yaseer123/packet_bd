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

// Define a type for the database client
interface DatabaseClient {
  product: {
    findFirst: (params: {
      where: {
        productCode: {
          not: null;
        };
        slug: {
          not: {
            endsWith: string;
          };
        };
      };
      orderBy: {
        productCode: "desc";
      };
      select: {
        productCode: boolean;
      };
    }) => Promise<{ productCode: string | null } | null>;
  };
}

// Generate a sequential unique product code for Meta catalog (e.g., 50000, 50001, ...)
export async function generateSequentialProductCode(
  db: DatabaseClient,
): Promise<string> {
  // Find the highest existing product code (as a number) from ACTIVE products only
  const highestProduct = await db.product.findFirst({
    where: {
      productCode: {
        not: null,
      },
      slug: {
        not: {
          endsWith: "-deleted",
        },
      },
    },
    orderBy: {
      productCode: "desc",
    },
    select: {
      productCode: true,
    },
  });

  let nextCode: number;
  if (
    highestProduct?.productCode &&
    !isNaN(Number(highestProduct.productCode))
  ) {
    nextCode = parseInt(highestProduct.productCode, 10) + 1;
  } else {
    nextCode = 50000; // Start from 50000 for privacy
  }

  return nextCode.toString();
}
