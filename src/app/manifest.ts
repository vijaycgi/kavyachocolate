import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kavya Chocolat",
    short_name: "Kavya",
    description: "Bean-to-bar chocolate made in small batches.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6efe3",
    theme_color: "#75212f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
