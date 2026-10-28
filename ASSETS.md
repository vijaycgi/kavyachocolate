# Assets and provenance

## Brand asset

| File | Source | Status |
| --- | --- | --- |
| `public/images/kavya-chocolat-logo.svg` | Supplied by the owner at `C:\VJ\Kavya\Logo\kavya_chocolat.svg` | Brand asset. Preserve proportions, clear space, and the burgundy/knockout treatment. |
| `src/app/icon.svg` | Derived from the supplied logo | Favicon/icon derivative. |

The logo is the only supplied visual asset. Everything below is **stock photography used as a placeholder**, not a photograph of a Kavya Chocolat product, studio, or ingredient supply.

## Photography

All raster images are downloaded and cropped by `scripts/build-images.mjs` with `sharp`, then written to `public/images/`. They are intentionally desaturated and darkened slightly to sit inside the cream/burgundy palette.

- **Pexels images** are used under the [Pexels License](https://www.pexels.com/license/): free to use and modify, attribution not required, no selling unaltered copies, no implying endorsement.
- The **Unsplash image** is used under the [Unsplash License](https://unsplash.com/license): free to use and modify, attribution not required, no selling unaltered copies, no compiling to replicate a similar service.
- Neither licence grants rights to the depicted brands or products. These are generic chocolate photographs.

### Product photography

| File | Dimensions | Source | Role |
| --- | --- | --- | --- |
| `public/images/products/classic.jpg` | 1200×1500 | Pexels [4113305](https://www.pexels.com/photo/4113305/) | Classic 70% card and detail plate. |
| `public/images/products/classic-detail.jpg` | 1200×1500 | Pexels [4113340](https://www.pexels.com/photo/4113340/) | Classic 70% hover/detail. |
| `public/images/products/dryfruit.jpg` | 1200×1500 | Pexels [7134663](https://www.pexels.com/photo/7134663/) | Dry-fruit bar card. |
| `public/images/products/dryfruit-detail.jpg` | 1200×1500 | Pexels [32430984](https://www.pexels.com/photo/32430984/) | Dry-fruit hover/detail; also the open-graph hero crop. |
| `public/images/products/jaggery.jpg` | 1200×1500 | Pexels [6167331](https://www.pexels.com/photo/6167331/) | Jaggery bar card. |
| `public/images/products/jaggery-detail.jpg` | 1200×1500 | Pexels [5252192](https://www.pexels.com/photo/5252192/) | Jaggery hover/detail. |
| `public/images/products/jaggery-dryfruit-dark.jpg` | 1200×1500 | Unsplash [`photo-1606312619070-d48b4c652a52`](https://images.unsplash.com/photo-1606312619070-d48b4c652a52) | Jaggery + dry-fruit card. Kept the `-dark` suffix to avoid a stale Next image-optimizer cache entry. |

### Editorial photography

| File | Dimensions | Source | Role |
| --- | --- | --- | --- |
| `public/images/editorial/hero.jpg` | 1500×1875 | Pexels [32430984](https://www.pexels.com/photo/32430984/) | Home hero plate and Open Graph image. |
| `public/images/editorial/pod.jpg` | 1200×1500 | Pexels [33662910](https://www.pexels.com/photo/33662910/) | Cocoa pod / origin section. |
| `public/images/editorial/beans.jpg` | 1400×1000 | Pexels [4157763](https://www.pexels.com/photo/4157763/) | Cocoa beans. |
| `public/images/editorial/bean-macro.jpg` | 1200×900 | Pexels [5252192](https://www.pexels.com/photo/5252192/) | Texture band / craft page. |
| `public/images/editorial/nuts.jpg` | 1000×1000 | Pexels [9615877](https://www.pexels.com/photo/9615877/) | Cashew/pistachio ingredient block. |
| `public/images/editorial/jaggery.jpg` | 1000×1000 | Pexels [37863445](https://www.pexels.com/photo/37863445/) | Jaggery ingredient block. |
| `public/images/editorial/bar-paper.jpg` | 1200×1500 | Pexels [6167328](https://www.pexels.com/photo/6167328/) | Wrapped bar / paper texture. |
| `public/images/editorial/atelier.jpg` | 1400×1000 | Pexels [9501655](https://www.pexels.com/photo/9501655/) | Studio/craft context. |
| `public/images/editorial/dark-pistachio.jpg` | 1400×1000 | Pexels [7134663](https://www.pexels.com/photo/7134663/) | Dark chocolate + pistachio band. |
| `public/images/editorial/collection.jpg` | 1400×1000 | Pexels [4113363](https://www.pexels.com/photo/4113363/) | Collection/closing image. |

### Processing

`scripts/build-images.mjs` applies:

- `.rotate()` to honour EXIF orientation,
- `.resize(w, h, { fit: "cover", position: "centre" })`,
- Pexels: `saturation 0.94`, `brightness 0.98`,
- Unsplash: `saturation 1.02`, `brightness 0.92`,
- `sharpen({ sigma: 0.6 })`,
- JPEG quality 86, mozjpeg.

Re-run `node scripts/build-images.mjs` only if you want to re-fetch the same placeholders. It requires network access and `sharp` (already a dev dependency).

---

## Replacing the placeholders with real photography

1. **Shoot or commission** the four bars as sold: front of pack, broken bar showing texture, and one ingredient/context frame per bar. Shoot upright 4:5 at 2400px or larger on the long edge.
2. **Export** JPEG at quality ~85, sRGB, no baked-in text.
3. **Replace** the files in `public/images/products/` while keeping the existing filenames (or update the product image paths in **Admin → Products**). Keeping filenames avoids touching the seed.
4. **Update alt text** in the admin product form and in the seed. Remove "placeholder photograph" once the image is real. Alt text should describe what is visible, not repeat the product name alone.
5. **Clear the image cache** if a replaced file looks stale:
   - development: stop the server and delete `.next/cache/images`,
   - or rename the file and update the product record (the same reason `jaggery-dryfruit-dark.jpg` exists).
6. **Remove unused placeholders** from `public/images/editorial/` once the pages no longer reference them.
7. **Update this file** with the photographer, date, and licence for any new image.

### What not to do

- Do not present a stock photo as the actual bar, packaging, or studio.
- Do not add certifications, awards, nutrition panels, or health claims to an image or label unless they are verified.
- Do not use an image of a different producer's branded packaging.
- Do not remove the "placeholder photograph" alt text until the image is genuinely the product being sold.

---

## Fonts

Loaded through `next/font/google` in `src/app/layout.tsx`:

| Role | Family | Weights | Notes |
| --- | --- | --- | --- |
| Display, UI, body, data | Sen | variable 400–800 | Self-hosted by Next at build time. One family for the whole site; headings use 600, body 400, labels 600 uppercase. |

Sen is an open-source Google Font. `display: "swap"` is set, and a system sans fallback is declared in `src/app/globals.css`. No italic or second family is loaded.
