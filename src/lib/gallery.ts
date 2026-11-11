export type GalleryImageRecord = {
  id: string;
  url: string;
  alt: string;
  position?: number;
};

/** Return a new list with one item swapped one place up or down. */
export function moveGalleryItem<T extends { id: string }>(
  items: T[],
  id: string,
  direction: "up" | "down",
): T[] {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return items;

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= items.length) return items;

  const next = items.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * The storefront always shows the product's main image as the cover. Gallery
 * rows follow in their saved order, with duplicates of the cover removed so a
 * product that also lists its main image in the gallery does not show it twice.
 */
export function buildProductGalleryImages(
  main: { id: string; url: string; name: string },
  images: { id: string; url: string; alt: string }[],
) {
  const seen = new Set([main.url]);
  const gallery: { id: string; url: string; alt: string }[] = [];

  for (const image of images) {
    if (seen.has(image.url)) continue;
    seen.add(image.url);
    gallery.push({ id: image.id, url: image.url, alt: image.alt });
  }

  return [
    { id: `cover-${main.id}`, url: main.url, alt: `${main.name} photograph` },
    ...gallery,
  ];
}
