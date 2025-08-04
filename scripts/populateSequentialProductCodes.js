import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function populateSequentialProductCodes() {
  try {
    console.log("Starting sequential product code population...");

    // First, clear product codes from deleted products to avoid conflicts
    console.log("Clearing product codes from deleted products...");
    const deletedProducts = await prisma.product.findMany({
      where: {
        slug: {
          endsWith: "-deleted",
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        productCode: true,
      },
    });

    for (const product of deletedProducts) {
      if (product.productCode) {
        await prisma.product.update({
          where: { id: product.id },
          data: { productCode: null },
        });
        console.log(
          `Cleared product code from deleted product: ${product.title} (${product.slug})`,
        );
      }
    }

    // Fetch all active products ordered by creation date
    const products = await prisma.product.findMany({
      where: {
        slug: {
          not: {
            endsWith: "-deleted",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        productCode: true,
      },
    });

    console.log(`Found ${products.length} active products to update`);

    // Clear existing product codes from active products
    console.log("Clearing existing product codes from active products...");
    for (const product of products) {
      if (product.productCode) {
        await prisma.product.update({
          where: { id: product.id },
          data: { productCode: null },
        });
        console.log(`Cleared product code for: ${product.title}`);
      }
    }

    // Now assign new sequential codes
    console.log("Assigning new sequential product codes...");
    let nextCode = 50000;
    for (const product of products) {
      const newCode = nextCode.toString();
      await prisma.product.update({
        where: { id: product.id },
        data: { productCode: newCode },
      });
      console.log(
        `✅ Updated product "${product.title}" (${product.slug}) with product code: ${newCode}`,
      );
      nextCode++;
    }

    console.log("🎉 Finished assigning sequential product codes!");
  } catch (error) {
    console.error("Error populating sequential product codes:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log("Database connection closed");
  }
}

populateSequentialProductCodes().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
