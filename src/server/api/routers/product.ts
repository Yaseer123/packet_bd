import { generateSKU } from "@/lib/utils";
import { type CategoryAttribute } from "@/schemas/categorySchema";
import { productSchema, updateProductSchema } from "@/schemas/productSchema";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  type createTRPCContext,
} from "@/server/api/trpc";
import type { ProductWithCategory, Variant } from "@/types/ProductType";
import { validateCategoryAttributes } from "@/utils/validateCategoryAttributes";
import type { Category, Prisma, Product } from "@prisma/client";
import { StockStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// Helper to ensure variants are an array of objects
function isVariant(v: unknown): v is Variant {
  return (
    typeof v === "object" && v !== null && !Array.isArray(v) && "sku" in v // 'sku' is a property of Variant
  );
}

function normalizeVariants(variants: unknown): Variant[] {
  if (Array.isArray(variants)) {
    return variants.filter(isVariant);
  }
  if (typeof variants === "string") {
    try {
      const parsed: unknown = JSON.parse(variants);
      if (Array.isArray(parsed)) {
        return parsed.filter(isVariant);
      }
      return [];
    } catch {
      return [];
    }
  }
  // Explicitly return [] for all other types to avoid returning any
  return [];
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Helper to get the root/primary category name for a given categoryId
async function getRootCategoryName(
  ctx: Context,
  categoryId: string,
): Promise<string> {
  let currentId = categoryId;
  let lastName = "XX";
  while (currentId) {
    const cat: Category | null = await ctx.db.category.findUnique({
      where: { id: currentId },
    });
    if (!cat) break;
    lastName = cat.name;
    if (!cat.parentId) break;
    currentId = cat.parentId;
  }
  return lastName;
}

// Helper to convert a Prisma product result to ProductWithCategory
function toProductWithCategory(product: unknown): ProductWithCategory {
  if (!product || typeof product !== "object" || !("category" in product)) {
    throw new Error("Invalid product object");
  }
  const prod = product as Product & { category: Category | null };
  let variants: Variant[] | null = null;
  if (Array.isArray(prod.variants)) {
    variants = normalizeVariants(prod.variants);
  } else if (typeof prod.variants === "string") {
    try {
      const parsed: unknown = JSON.parse(prod.variants);
      if (Array.isArray(parsed)) {
        variants = normalizeVariants(parsed);
      } else {
        variants = [];
      }
    } catch {
      variants = [];
    }
  } else if (prod.variants === null) {
    variants = null;
  } else {
    variants = [];
  }
  return {
    ...prod,
    variants: variants,
  };
}

export const productRouter = createTRPCRouter({
  getProductByIdAdmin: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      }),
    )
    .query(async ({ ctx, input }): Promise<ProductWithCategory | null> => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: { category: true },
      });

      if (!product) return null;

      return toProductWithCategory(product);
    }),

  getAll: publicProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(10),
          search: z.string().optional(),
          sort: z
            .enum([
              "position",
              "titleAsc",
              "titleDesc",
              "priceAsc",
              "priceDesc",
            ])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const skip = (page - 1) * limit;
      const search = input?.search?.trim() ?? "";
      const sort = input?.sort ?? "position";

      // Build where filter for search
      const where: Prisma.ProductWhereInput = {
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: "insensitive" as Prisma.QueryMode,
                  },
                },
                {
                  brand: {
                    contains: search,
                    mode: "insensitive" as Prisma.QueryMode,
                  },
                },
              ],
            }
          : {}),
      };

      // Build orderBy
      let orderBy: Prisma.ProductOrderByWithRelationInput = { position: "asc" };
      if (sort === "titleAsc") orderBy = { title: "asc" };
      if (sort === "titleDesc") orderBy = { title: "desc" };
      if (sort === "priceAsc") orderBy = { price: "asc" };
      if (sort === "priceDesc") orderBy = { price: "desc" };

      const [productsRaw] = await Promise.all([
        ctx.db.product.findMany({
          where,
          include: { category: true },
          orderBy,
          skip,
          take: limit,
        }),
      ]);
      const products: (Product & { category: Category | null })[] =
        Array.isArray(productsRaw)
          ? productsRaw.filter(
              (p): p is Product & { category: Category | null } =>
                !!p && typeof p === "object" && "category" in p,
            )
          : [];
      // Filter out soft-deleted products
      const filteredProducts = products.filter((p) => p.deletedAt === null);
      const filteredTotal = filteredProducts.length;
      const totalPages = Math.ceil(filteredTotal / limit);

      return {
        products: filteredProducts.map(toProductWithCategory),
        total: filteredTotal,
        page,
        limit,
        totalPages,
      };
    }),

  getAllByCategory: publicProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }): Promise<ProductWithCategory[]> => {
      let products: (Product & { category: Category | null })[] = [];
      if (!input.categoryId) {
        const result = await ctx.db.product.findMany({
          include: { category: true },
        });
        if (Array.isArray(result)) {
          products = result.filter(
            (p): p is Product & { category: Category | null } =>
              !!p && typeof p === "object" && "category" in p,
          );
        }
      } else {
        const getChildCategoryIds = async (
          parentId: string,
        ): Promise<string[]> => {
          const subcategories = await ctx.db.category.findMany({
            where: { parentId },
            select: { id: true },
          });

          const childIds = subcategories.map((subcategory) => subcategory.id);
          const nestedChildIds = await Promise.all(
            childIds.map((id) => getChildCategoryIds(id)),
          );

          return [parentId, ...nestedChildIds.flat()];
        };

        const categoryIds = await getChildCategoryIds(input.categoryId);

        products = await ctx.db.product.findMany({
          where: { categoryId: { in: categoryIds } },
          include: { category: true },
          orderBy: { position: "asc" },
        });
      }

      return products
        .map(toProductWithCategory)
        .filter((p) => p.deletedAt === null);
    }),

  getProductById: publicProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: { category: true },
      });
      // Exclude soft-deleted products
      if (product?.deletedAt) return null;
      return product;
    }),

  getAllWithFilters: publicProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
        onSale: z.boolean().optional(),
        brands: z.array(z.string()).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        sort: z.string().optional(),
        attributes: z
          .record(z.union([z.string(), z.array(z.string())]))
          .optional(),
        stockStatus: z
          .array(z.enum(["IN_STOCK", "OUT_OF_STOCK", "PRE_ORDER"]))
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        categoryId,
        onSale,
        brands,
        minPrice,
        maxPrice,
        sort,
        attributes,
        stockStatus,
      } = input;

      // Use Prisma's type system for filters
      const filters: Prisma.ProductWhereInput = {};

      // Category filter with recursive children lookup
      if (categoryId) {
        // Fetch all child category IDs recursively
        const getChildCategoryIds = async (
          parentId: string,
        ): Promise<string[]> => {
          const subcategories = await ctx.db.category.findMany({
            where: { parentId },
            select: { id: true },
          });

          const childIds = subcategories.map((subcategory) => subcategory.id);
          const nestedChildIds = await Promise.all(
            childIds.map((id) => getChildCategoryIds(id)),
          );

          return [parentId, ...nestedChildIds.flat()];
        };

        const categoryIds = await getChildCategoryIds(categoryId);
        filters.categoryId = { in: categoryIds };
      }

      // Sale filter
      if (onSale === true) {
        filters.sale = true;
      }

      // Brand filter - updated for multiple brands
      if (brands && brands.length > 0) {
        filters.brand = {
          in: brands,
          mode: "insensitive" as Prisma.QueryMode, // Case insensitive search with type assertion
        };
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        filters.price = {};

        if (minPrice !== undefined) {
          filters.price.gte = minPrice;
        }

        if (maxPrice !== undefined) {
          filters.price.lte = maxPrice;
        }
      }

      // Add attribute filters if provided - Updated for multiple selection support
      if (attributes && Object.keys(attributes).length > 0) {
        Object.entries(attributes).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (!filters.AND) {
              filters.AND = [];
            } else if (!Array.isArray(filters.AND)) {
              filters.AND = [filters.AND];
            }

            if (Array.isArray(value)) {
              // Multiple values selected - any match is valid (OR condition)
              const orConditions = value.map((val) => ({
                categoryAttributes: {
                  path: [key],
                  equals: val,
                },
              }));

              filters.AND.push({ OR: orConditions });
            } else {
              // Single value selected
              filters.AND.push({
                categoryAttributes: {
                  path: [key],
                  equals: value,
                },
              });
            }
          }
        });
      }

      // Stock status filter (based on stock number)
      if (stockStatus && stockStatus.length > 0) {
        const orConditions = [];
        if (stockStatus.includes("OUT_OF_STOCK")) {
          orConditions.push({ stock: 0 });
        }
        if (stockStatus.includes("IN_STOCK")) {
          orConditions.push({ stock: { gt: 0 } });
        }
        if (stockStatus.includes("PRE_ORDER")) {
          orConditions.push({ stockStatus: { equals: StockStatus.PRE_ORDER } });
        }
        if (orConditions.length === 1) {
          Object.assign(filters, orConditions[0]);
        } else if (orConditions.length > 1) {
          if (!filters.AND) filters.AND = [];
          if (!Array.isArray(filters.AND)) filters.AND = [filters.AND];
          filters.AND.push({ OR: orConditions });
        }
      }

      // Build sort options
      let orderBy: Prisma.ProductOrderByWithRelationInput | undefined;
      if (sort) {
        if (sort === "priceHighToLow") {
          orderBy = { price: "desc" };
        } else if (sort === "priceLowToHigh") {
          orderBy = { price: "asc" };
        }
      }

      // Fetch products with filters and sorting in a single query
      const products = await ctx.db.product.findMany({
        where: filters,
        include: { category: true },
        orderBy: orderBy ?? { position: "asc" },
      });

      // Filter out soft-deleted products
      return products.filter((p) => p.deletedAt === null);
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query } = input;

      const products = await ctx.db.product.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
            {
              shortDescription: {
                contains: query,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
            {
              brand: {
                contains: query,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
            {
              slug: {
                contains: query,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
            {
              sku: {
                contains: query,
                mode: "insensitive" as Prisma.QueryMode,
              },
            },
            {
              allSkus: { has: query },
            },
          ],
        },
        include: { category: true },
      });

      return products;
    }),

  add: adminProcedure.input(productSchema).mutation(async ({ ctx, input }) => {
    const { categoryAttributes, categoryId } = input;

    // Get category details to validate attributes
    if (categoryId) {
      const category = await ctx.db.category.findUnique({
        where: { id: categoryId },
        select: { attributes: true },
      });

      if (category) {
        // Parse the category attributes
        let categoryAttributeDefinitions: CategoryAttribute[] = [];

        try {
          if (typeof category.attributes === "string") {
            categoryAttributeDefinitions = JSON.parse(
              category.attributes,
            ) as CategoryAttribute[];
          } else if (Array.isArray(category.attributes)) {
            categoryAttributeDefinitions =
              category.attributes as CategoryAttribute[];
          }

          // Validate that the product satisfies the category's required attributes
          const validation = validateCategoryAttributes(
            categoryAttributes || {},
            categoryAttributeDefinitions,
          );

          if (!validation.isValid) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Category attribute validation failed: ${validation.errors.join(", ")}`,
            });
          }
        } catch (error: unknown) {
          if (error instanceof TRPCError) throw error;
          if (error instanceof Error) {
            console.error(
              "Failed to parse category attributes:",
              error.message,
            );
          } else {
            console.error("Failed to parse category attributes:", error);
          }
        }
      }
    }

    // --- Stock status auto logic ---
    let stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "PRE_ORDER" = "IN_STOCK";
    if ("stockStatus" in input && input.stockStatus === "PRE_ORDER") {
      stockStatus = "PRE_ORDER";
    } else if (input.stock === 0) {
      stockStatus = "OUT_OF_STOCK";
    } else {
      stockStatus = "IN_STOCK";
    }
    // --- End stock status auto logic ---

    // Prepare categoryName for SKU
    let categoryName = "XX";
    if (input.categoryId) {
      const cat = await ctx.db.category.findUnique({
        where: { id: input.categoryId },
      });
      if (cat?.name) categoryName = cat.name;
    }

    // Create product without SKU first to get the ID
    const createdProduct = await ctx.db.product.create({
      data: {
        title: input.title,
        shortDescription: input.shortDescription,
        slug: input.slug,
        description: input.description,
        price: input.price,
        categoryId: input.categoryId,
        imageId: input.imageId,
        images: input.images,
        descriptionImageId: input.descriptionImageId,
        stock: input.stock,
        discountedPrice: input.discountedPrice,
        brand: input.brand,
        defaultColor: input.defaultColor,
        defaultSize: input.defaultSize,
        estimatedDeliveryTime: input.estimatedDeliveryTime,
        attributes: input.attributes, // Store regular specifications
        categoryAttributes: categoryAttributes || {}, // Store category-specific attributes
        stockStatus, // <-- always set
        variants: input.variants ?? undefined, // Store variants if present
      },
    });

    // Update variants with SKUs
    const updatedVariants = normalizeVariants(createdProduct.variants).map(
      (v) => ({
        ...v,
        sku: generateSKU({
          categoryName,
          productId: createdProduct.id,
          color: typeof v.colorName === "string" ? v.colorName : "UNNAMED",
          size: typeof v.size === "string" ? v.size : undefined,
        }),
      }),
    );
    // Now update with the real SKU (using the new product ID) and updated variants
    const realSKU = generateSKU({
      categoryName,
      productId: createdProduct.id,
      color:
        typeof input.defaultColor === "string" ? input.defaultColor : "UNNAMED",
      size:
        typeof input.defaultSize === "string" ? input.defaultSize : undefined,
    });
    const allSkus = [
      realSKU,
      ...updatedVariants.map((v) =>
        typeof v.sku === "string" ? v.sku : undefined,
      ),
    ].filter((sku): sku is string => typeof sku === "string");
    const product = await ctx.db.product.update({
      where: { id: createdProduct.id },
      data: { sku: realSKU, variants: updatedVariants, allSkus },
      include: { category: true },
    });

    return product;
  }),

  update: adminProcedure
    .input(updateProductSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, categoryId, categoryAttributes, ...updateData } = input;

      // If category or attributes are being updated, validate them
      if (categoryId && categoryAttributes) {
        const category = await ctx.db.category.findUnique({
          where: { id: categoryId },
          select: { attributes: true },
        });

        if (category) {
          // Parse the category attributes
          let categoryAttributeDefinitions: CategoryAttribute[] = [];
          try {
            if (typeof category.attributes === "string") {
              categoryAttributeDefinitions = JSON.parse(
                category.attributes,
              ) as CategoryAttribute[];
            } else if (Array.isArray(category.attributes)) {
              categoryAttributeDefinitions =
                category.attributes as CategoryAttribute[];
            }

            // Validate that the product satisfies the category's required attributes
            const validation = validateCategoryAttributes(
              categoryAttributes || {},
              categoryAttributeDefinitions,
            );

            if (!validation.isValid) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Category attribute validation failed: ${validation.errors.join(", ")}`,
              });
            }
          } catch (error: unknown) {
            if (error instanceof TRPCError) throw error;
            if (error instanceof Error) {
              console.error(
                "Failed to parse category attributes:",
                error.message,
              );
            } else {
              console.error("Failed to parse category attributes:", error);
            }
          }
        }
      }

      // --- Stock status auto logic ---
      let stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "PRE_ORDER" | undefined =
        undefined;
      if ("stockStatus" in input && input.stockStatus === "PRE_ORDER") {
        stockStatus = "PRE_ORDER";
      } else if (typeof input.stock === "number") {
        if (input.stock === 0) {
          stockStatus = "OUT_OF_STOCK";
        } else {
          stockStatus = "IN_STOCK";
        }
      }
      // --- End stock status auto logic ---

      // Fetch product to get current values if needed
      const existingProduct = await ctx.db.product.findUnique({
        where: { id },
        include: { category: true },
      });

      // Always fetch the root/primary category from the DB for SKU
      const rootCategoryName = await getRootCategoryName(
        ctx,
        categoryId ?? existingProduct?.categoryId ?? "",
      );
      const newCategoryName = rootCategoryName;

      // Always regenerate SKU for main product
      const newSKU = generateSKU({
        categoryName: newCategoryName,
        productId: id,
        color:
          typeof input.defaultColor === "string"
            ? input.defaultColor
            : typeof existingProduct?.defaultColor === "string"
              ? existingProduct?.defaultColor
              : "UNNAMED",
        size:
          typeof input.defaultSize === "string"
            ? input.defaultSize
            : typeof existingProduct?.defaultSize === "string"
              ? existingProduct?.defaultSize
              : undefined,
      });

      // Debug log for SKU update
      console.log("Updating SKU to:", newSKU, "for product", id);

      // Always regenerate SKUs for all variants, ignore incoming variant SKUs
      const updatedVariantsFromInput = normalizeVariants(input.variants).map(
        (v) => {
          return {
            ...v,
            sku: generateSKU({
              categoryName: newCategoryName,
              productId: id,
              color: typeof v.colorName === "string" ? v.colorName : "UNNAMED",
              size: typeof v.size === "string" ? v.size : undefined,
            }),
          };
        },
      );

      // Build the update data object field-by-field to avoid linter errors
      const allSkus = [
        newSKU,
        ...updatedVariantsFromInput.map((v) =>
          typeof v.sku === "string" ? v.sku : undefined,
        ),
      ].filter((sku): sku is string => typeof sku === "string");
      const product = await ctx.db.product.update({
        where: { id },
        data: {
          // Only set allowed fields
          title: updateData.title,
          slug: updateData.slug,
          shortDescription: updateData.shortDescription,
          description: updateData.description,
          price: updateData.price,
          discountedPrice: updateData.discountedPrice,
          stock: updateData.stock,
          brand: updateData.brand,
          defaultColor:
            typeof input.defaultColor === "string"
              ? input.defaultColor
              : undefined,
          defaultSize:
            typeof input.defaultSize === "string"
              ? input.defaultSize
              : undefined,
          images: updateData.images,
          descriptionImageId: updateData.descriptionImageId,
          attributes: updateData.attributes,
          estimatedDeliveryTime: updateData.estimatedDeliveryTime,
          categoryAttributes: categoryAttributes ?? {},
          category: categoryId ? { connect: { id: categoryId } } : undefined,
          ...(stockStatus ? { stockStatus } : {}),
          variants: updatedVariantsFromInput ?? undefined, // Update variants with SKUs
          sku: newSKU ?? undefined, // Always set the correct SKU, ensure type safety
          allSkus,
        },
      });
      return product;
    }),

  getPriceRange: publicProcedure.query(async ({ ctx }) => {
    // Find the lowest priced product
    const minPriceProduct = await ctx.db.product.findFirst({
      orderBy: {
        price: "asc",
      },
      select: {
        price: true,
      },
    });

    // Find the highest priced product
    const maxPriceProduct = await ctx.db.product.findFirst({
      orderBy: {
        price: "desc",
      },
      select: {
        price: true,
      },
    });

    return {
      min: minPriceProduct?.price ?? 0,
      max: maxPriceProduct?.price ?? 1000,
    };
  }),

  getBrandsByCategory: publicProcedure
    .input(
      z.object({
        categoryId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { categoryId } = input;

      if (!categoryId) {
        // If no category is selected, return all unique brands
        const allProducts = await ctx.db.product.findMany({
          select: { brand: true },
        });

        const uniqueBrands = Array.from(
          new Set(
            allProducts
              .map((product) => product.brand.toLowerCase())
              .filter((b) => b && b.trim() !== ""),
          ),
        ).sort();

        return uniqueBrands;
      }

      // Get all subcategory IDs recursively for the selected category
      const getChildCategoryIds = async (
        parentId: string,
      ): Promise<string[]> => {
        const subcategories = await ctx.db.category.findMany({
          where: { parentId },
          select: { id: true },
        });

        const childIds = subcategories.map((subcategory) => subcategory.id);
        const nestedChildIds = await Promise.all(
          childIds.map((id) => getChildCategoryIds(id)),
        );

        return [parentId, ...nestedChildIds.flat()];
      };

      const categoryIds = await getChildCategoryIds(categoryId);

      // Get products for the selected category and its subcategories
      const products = await ctx.db.product.findMany({
        where: {
          categoryId: { in: categoryIds },
        },
        select: {
          brand: true,
        },
      });

      // Extract unique brands and sort them
      const uniqueBrands = Array.from(
        new Set(
          products
            .map((product) => product.brand.toLowerCase())
            .filter((b) => b && b.trim() !== ""),
        ),
      ).sort();

      return uniqueBrands;
    }),

  // Add a new procedure to get category attributes for filtering
  getCategoryAttributes: publicProcedure
    .input(
      z.object({
        categoryId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { categoryId } = input;

      // Get the category to access its attribute definitions
      const category = await ctx.db.category.findUnique({
        where: { id: categoryId },
        select: {
          attributes: true,
        },
      });

      if (!category) {
        return [];
      }

      // Parse the attributes - ensure they conform to the CategoryAttribute type
      let attributeDefinitions: CategoryAttribute[] = [];
      try {
        if (typeof category.attributes === "string") {
          const parsed = JSON.parse(category.attributes) as unknown[];
          // Filter to only include "select" type attributes
          attributeDefinitions = Array.isArray(parsed)
            ? parsed.filter(
                (attr): attr is CategoryAttribute =>
                  typeof attr === "object" &&
                  attr !== null &&
                  "type" in attr &&
                  attr.type === "select",
              )
            : [];
        } else if (Array.isArray(category.attributes)) {
          // Filter to only include "select" type attributes
          attributeDefinitions = category.attributes.filter(
            (attr): attr is CategoryAttribute =>
              typeof attr === "object" &&
              attr !== null &&
              "type" in attr &&
              attr.type === "select",
          );
        }
      } catch (error: unknown) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error) {
          console.error("Failed to parse category attributes:", error.message);
        } else {
          console.error("Failed to parse category attributes:", error);
        }
        return [];
      }

      // Get all products in this category to extract available attribute values
      const getChildCategoryIds = async (
        parentId: string,
      ): Promise<string[]> => {
        const subcategories = await ctx.db.category.findMany({
          where: { parentId },
          select: { id: true },
        });

        const childIds = subcategories.map((subcategory) => subcategory.id);
        const nestedChildIds = await Promise.all(
          childIds.map((id) => getChildCategoryIds(id)),
        );

        return [parentId, ...nestedChildIds.flat()];
      };

      const categoryIds = await getChildCategoryIds(categoryId);

      // Get products with their categoryAttributes (updated from attributes)
      const products = await ctx.db.product.findMany({
        where: {
          categoryId: { in: categoryIds },
        },
        select: {
          categoryAttributes: true, // Select categoryAttributes directly
        },
      });

      // Extract available values for each attribute
      const attributeValues: Record<string, Set<string>> = {}; // Only string values now

      // For each product, extract attribute values directly from categoryAttributes
      products.forEach((product) => {
        if (!product.categoryAttributes) return;

        const attrs = product.categoryAttributes as Record<string, unknown>;
        Object.entries(attrs).forEach(([key, value]) => {
          if (!attributeValues[key]) {
            attributeValues[key] = new Set();
          }

          // Only handle string values or arrays of strings
          if (typeof value === "string") {
            attributeValues[key].add(value);
          } else if (Array.isArray(value)) {
            value.forEach((v) => {
              if (typeof v === "string") {
                // Re-check existence since we're inside a closure
                if (!attributeValues[key]) {
                  attributeValues[key] = new Set();
                }
                attributeValues[key].add(v);
              }
            });
          }
        });
      });

      // Combine attribute definitions with available values
      const resultAttributes = attributeDefinitions.map((attr) => {
        // Get available values for this attribute
        const values = attributeValues[attr.name];
        const availableValues = values ? Array.from(values) : [];

        return {
          ...attr,
          availableValues: attr.options?.length
            ? attr.options
            : availableValues,
        };
      });

      return resultAttributes;
    }),

  updateStockStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        stockStatus: z.enum(["IN_STOCK", "OUT_OF_STOCK", "PRE_ORDER"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, stockStatus } = input;

      // Ensure the user is an admin
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update product status",
        });
      }

      return ctx.db.product.update({
        where: { id },
        data: { stockStatus },
      });
    }),

  delete: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Soft delete: set deletedAt instead of deleting
      return ctx.db.product.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    }),

  // Add these procedures to your product router

  getFeaturedProducts: publicProcedure
    .input(
      z.object({
        limit: z.number().optional().default(4),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.product.findMany({
        where: {
          featured: true,
          // published: true,
        },
        take: input.limit,
        include: {
          category: true,
        },
        orderBy: { position: "asc" },
      });
    }),

  updateFeaturedStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        featured: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.update({
        where: {
          id: input.id,
        },
        data: {
          featured: input.featured,
        },
      });
    }),

  updateProductPositions: adminProcedure
    .input(
      z.object({
        positions: z.array(z.object({ id: z.string(), position: z.number() })),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Update each product's position
      const updates = input.positions.map(({ id, position }) =>
        ctx.db.product.update({ where: { id }, data: { position } }),
      );
      await Promise.all(updates);
      return { success: true };
    }),

  getProductBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { slug: input.slug },
        include: { category: true },
      });
      if (product?.deletedAt) return null;
      return product;
    }),
});
