"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryImage = { id: string; url: string; alt: string };

export function ProductGallery({
  images,
  name,
}: {
  images: GalleryImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden border border-line bg-paper-2">
        {current ? (
          <Image
            key={current.id}
            src={current.url}
            alt={current.alt || `${name} — placeholder photograph`}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 46vw, 100vw"
            className="animate-fade object-cover"
          />
        ) : null}
        <span className="absolute left-4 top-4 bg-paper/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-2">
          Placeholder photograph
        </span>
      </div>

      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-pressed={index === active}
              className={`relative aspect-square overflow-hidden border transition-colors ${
                index === active ? "border-burgundy" : "border-line hover:border-ink-2"
              }`}
            >
              <Image src={image.url} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
