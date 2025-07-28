import { db } from "@/server/db";
import type { Category, Product } from "@prisma/client";
import { NextResponse } from "next/server";

// Type for the database query result
type ProductWithCategoryResult = Product & {
  category: Category | null;
};

// Helper function to get the first image from product images
const getFirstImage = (images: string[] | null): string => {
  if (!images || images.length === 0) {
    return "https://packetbd.s3.ap-southeast-1.amazonaws.com/default-product-image.jpg";
  }
  return (
    images[0] ??
    "https://packetbd.s3.ap-southeast-1.amazonaws.com/default-product-image.jpg"
  );
};

// Helper function to determine availability
const getAvailability = (stock: number, stockStatus: string): string => {
  if (stockStatus === "PRE_ORDER") return "preorder";
  if (stock > 0) return "in stock";
  return "out of stock";
};

// Helper function to get product URL
const getProductUrl = (slug: string): string => {
  return `https://www.packetbd.com/products/${slug}`;
};

// Helper function to clean text for CSV
const cleanText = (text: string | null): string => {
  if (!text) return "";
  return text.replace(/[\r\n"]/g, " ").trim();
};

// Helper function to get category name
const getCategoryName = (product: ProductWithCategoryResult): string => {
  return product.category?.name ?? "General";
};

export async function GET() {
  try {
    // Fetch all active products from database
    const products = await db.product.findMany({
      where: {
        deletedAt: null, // Only non-deleted products
      },
      include: {
        category: true,
      },
      orderBy: {
        position: "asc",
      },
    });

    // Meta Catalog Feed required fields - following exact Meta template
    const header = [
      "id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "link",
      "image_link",
      "brand",
      "google_product_category",
      "fb_product_category",
      "quantity_to_sell_on_facebook",
      "sale_price",
      "sale_price_effective_date",
      "item_group_id",
      "gender",
      "color",
      "size",
      "age_group",
      "material",
      "pattern",
      "shipping",
      "shipping_weight",
      "gtin",
      "video[0].url",
      "video[0].tag[0]",
      "product_tags[0]",
      "product_tags[1]",
      "style[0]",
    ];

    const rows = products.map((product) => {
      // Use discounted price if available, otherwise use regular price
      const finalPrice = product.discountedPrice ?? product.price;

      // Get the first image or use a default
      const imageUrl = getFirstImage(product.images);

      // Determine availability
      const availability = getAvailability(
        product.stock,
        product.stockStatus ?? "IN_STOCK",
      );

      // Get product URL
      const productUrl = getProductUrl(product.slug);

      // Get category name
      const categoryName = getCategoryName(product);

      return [
        product.sku ?? product.id, // id
        cleanText(product.title), // title
        cleanText(product.shortDescription ?? product.description), // description
        availability, // availability
        "new", // condition
        `${finalPrice} BDT`, // price
        productUrl, // link
        imageUrl, // image_link
        cleanText(product.brand ?? "Packet BD"), // brand
        "", // google_product_category
        categoryName, // fb_product_category
        product.stock?.toString() ?? "1", // quantity_to_sell_on_facebook
        product.discountedPrice ? `${product.discountedPrice} BDT` : "", // sale_price
        "", // sale_price_effective_date
        "", // item_group_id
        "", // gender
        product.defaultColor ?? "", // color
        product.defaultSize ?? "", // size
        "", // age_group
        "", // material
        "", // pattern
        "BD:Ground:0.0 BDT", // shipping (free shipping in Bangladesh)
        "", // shipping_weight
        product.sku ?? "", // gtin
        "", // video[0].url
        "", // video[0].tag[0]
        product.featured ? "Featured" : "", // product_tags[0]
        product.sale ? "Sale" : "", // product_tags[1]
        "", // style[0]
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "inline; filename=meta-catalog-feed.csv",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating Meta feed:", error);
    return new NextResponse("Error generating feed", { status: 500 });
  }
}
