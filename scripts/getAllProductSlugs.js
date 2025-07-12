import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAllProductSlugs() {
  const products = await prisma.product.findMany({
    select: { slug: true },
  });
  return products.map((p) => p.slug);
}
