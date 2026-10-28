import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export const productInclude = {
  variants: { where: { active: true }, orderBy: { weightGrams: "asc" } },
  images: { orderBy: { position: "asc" } },
} satisfies Prisma.ProductInclude;

export type StoreProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
export type StoreVariant = StoreProduct["variants"][number];

export async function getStoreProducts() {
  return prisma.product.findMany({
    where: { published: true },
    include: productInclude,
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
}

export async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { published: true, featured: true },
    include: productInclude,
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, published: true },
    include: productInclude,
  });
}

export async function getRelatedProducts(slug: string, limit = 3) {
  return prisma.product.findMany({
    where: { published: true, slug: { not: slug } },
    include: productInclude,
    orderBy: [{ position: "asc" }],
    take: limit,
  });
}

export function priceRange(product: StoreProduct) {
  if (product.variants.length === 0) return null;
  const prices = product.variants.map((variant) => variant.priceMinor);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function totalStock(product: StoreProduct) {
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
}

export const collectionLabels: Record<string, string> = {
  CLASSIC: "Classic",
  DRY_FRUIT: "With dry fruits",
  JAGGERY: "Jaggery-sweetened",
  JAGGERY_DRY_FRUIT: "Jaggery + dry fruits",
};

export function collectionLabel(collection: string) {
  return collectionLabels[collection] ?? collection;
}
