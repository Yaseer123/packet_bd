import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(text) {
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
async function generateUniqueSlug(baseSlug) {
  // Check if slug already exists
  const existing = await prisma.category.findFirst({
    where: { slug: baseSlug },
    select: { slug: true },
  });

  if (!existing) {
    return baseSlug;
  }

  // Find all slugs that start with baseSlug-
  const numberedSlugs = await prisma.category.findMany({
    where: {
      slug: {
        startsWith: `${baseSlug}-`,
      },
    },
    select: { slug: true },
    orderBy: { slug: "desc" },
  });

  if (numberedSlugs.length === 0) {
    return `${baseSlug}-1`;
  }

  // Extract the highest number from the slugs
  let maxNumber = 0;
  for (const item of numberedSlugs) {
    const match = item.slug?.match(/-(\d+)$/);
    if (match) {
      const num = parseInt(match[1] || "0", 10);
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  return `${baseSlug}-${maxNumber + 1}`;
}

async function populateCategorySlugs() {
  console.log("Starting to populate category slugs...");

  try {
    // Get all categories
    const categories = await prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    });

    console.log(`Found ${categories.length} categories to process`);

    // Process each category
    for (const category of categories) {
      // Skip if slug already exists
      if (category.slug) {
        console.log(`Skipping ${category.name} - already has slug: ${category.slug}`);
        continue;
      }

      // Generate slug from name
      const baseSlug = generateSlug(category.name);
      
      // Generate unique slug
      const uniqueSlug = await generateUniqueSlug(baseSlug);

      // Update category with slug
      await prisma.category.update({
        where: { id: category.id },
        data: { slug: uniqueSlug },
      });

      console.log(`Updated ${category.name} -> ${uniqueSlug}`);
    }

    console.log("✅ Successfully populated all category slugs!");
  } catch (error) {
    console.error("❌ Error populating category slugs:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

populateCategorySlugs()
  .then(() => {
    console.log("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

