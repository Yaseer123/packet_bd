import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a URL-friendly slug from a string
 * Converts to lowercase, replaces spaces/special chars with hyphens, removes duplicates
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, and hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a number if needed
 */
export async function generateUniqueSlug(
  db: {
    category: {
      findFirst: (args: {
        where: { slug?: string | { startsWith: string } };
        select: { slug: true };
        orderBy?: { slug: "desc" };
      }) => Promise<{ slug: string | null } | null>;
    };
  },
  baseSlug: string,
): Promise<string> {
  // Check if slug already exists
  const existing = await db.category.findFirst({
    where: { slug: baseSlug },
    select: { slug: true },
  });

  if (!existing) {
    return baseSlug;
  }

  // Find the highest numbered slug
  const numberedSlugs = await db.category.findFirst({
    where: {
      slug: {
        startsWith: `${baseSlug}-`,
      },
    },
    select: { slug: true },
    orderBy: { slug: "desc" },
  });

  if (!numberedSlugs?.slug) {
    return `${baseSlug}-1`;
  }

  // Extract the number from the slug
  const regex = /-(\d+)$/;
  const match = regex.exec(numberedSlugs.slug);
  const nextNumber = match ? parseInt(match[1] ?? "0", 10) + 1 : 1;

  return `${baseSlug}-${nextNumber}`;
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

/**
 * Generate category URL - uses slug if available, otherwise falls back to ID
 */
export function getCategoryUrl(category: {
  id: string;
  slug?: string | null;
}): string {
  if (category.slug) {
    return `/products/${category.slug}`;
  }
  // Fallback to ID-based URL for backwards compatibility
  return `/products?category=${category.id}`;
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
