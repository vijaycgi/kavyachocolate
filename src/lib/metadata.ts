import type { Metadata } from "next";
import { siteUrl } from "./site";

const defaultImage = "/images/editorial/hero.jpg";

/**
 * Social-card metadata for a public page. The root layout supplies the home
 * page card; every other page that can be shared needs its own, otherwise
 * links fall back to the home-page title and image.
 */
export function socialMetadata({
  title,
  description,
  path,
  image = defaultImage,
  imageAlt = "Kavya Chocolat",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: "Kavya Chocolat",
      url: `${siteUrl}${path}`,
      title,
      description,
      images: [{ url: image, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
