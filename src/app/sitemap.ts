import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl as base } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages have no stored update timestamp. Omitting lastModified is
  // honest; stamping every request with "now" teaches crawlers to ignore it.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/craft`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/policies`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/track-order`, changeFrequency: "yearly", priority: 0.3 },
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
