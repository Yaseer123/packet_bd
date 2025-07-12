import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding categories...");

  // Create Parent Categories (Level 1)
  await prisma.category.createMany({
    data: [
      { name: "Electronics" },
      { name: "Home & Kitchen" },
      { name: "Fashion" },
    ],
  });

  // Fetch inserted parents
  const parents = await prisma.category.findMany({
    where: { parentId: null },
  });

  // Create Child Categories (Level 2)
  const childCategories = [];
  for (const parent of parents) {
    await prisma.category.createMany({
      data: [
        { name: "Subcategory A", parentId: parent.id },
        { name: "Subcategory B", parentId: parent.id },
      ],
    });

    childCategories.push(
      ...(await prisma.category.findMany({ where: { parentId: parent.id } })),
    );
  }

  // Create Sub-Child Categories (Level 3)
  for (const child of childCategories) {
    await prisma.category.createMany({
      data: [
        { name: "Sub Subcategory 1", parentId: child.id },
        { name: "Sub Subcategory 2", parentId: child.id },
      ],
    });
  }

  console.log("Category seeding completed.");
}

main()
  .catch((e) => {
    console.error("Error seeding categories:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma
      .$disconnect()
      .catch((e) => console.error("Error disconnecting Prisma:", e));
  });
