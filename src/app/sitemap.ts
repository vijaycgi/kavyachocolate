import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/craft`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/policies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/track-order`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const products = await prisma.product.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
    return [
      ...staticRoutes,
      ...products.map((product) => ({
        url: `${base}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
