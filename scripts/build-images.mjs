import sharp from "sharp";
import { mkdirSync } from "node:fs";

// Placeholder photography pipeline.
// Sources: Pexels (https://www.pexels.com/license/) and one Unsplash image
// (https://unsplash.com/license). These are stock placeholders, not photographs
// of Kavya Chocolat products. See ASSETS.md for the file-by-file provenance and
// the replacement instructions before launch.

mkdirSync("public/images/products", { recursive: true });
mkdirSync("public/images/editorial", { recursive: true });

const base = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1800`;

async function make(id, out, w, h, position = "centre") {
  const r = await fetch(base(id));
  if (!r.ok) throw new Error(`${id} ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await sharp(buf)
    .rotate()
    .resize(w, h, { fit: "cover", position })
    .modulate({ saturation: 0.94, brightness: 0.98 })
    .sharpen({ sigma: 0.6 })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out);
  console.log(out);
}

async function makeUnsplash(url, out, w, h, position = "centre") {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await sharp(buf)
    .rotate()
    .resize(w, h, { fit: "cover", position })
    .modulate({ saturation: 1.02, brightness: 0.92 })
    .sharpen({ sigma: 0.6 })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out);
  console.log(out);
}

const P = "public/images/products/";
const E = "public/images/editorial/";

await make("4113305", `${P}classic.jpg`, 1200, 1500, "centre");
await make("7134663", `${P}dryfruit.jpg`, 1200, 1500, "centre");
await make("6167331", `${P}jaggery.jpg`, 1200, 1500, "centre");
await makeUnsplash(
  "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=1800&q=85",
  `${P}jaggery-dryfruit-dark.jpg`,
  1200,
  1500,
  "centre",
);
await make("4113340", `${P}classic-detail.jpg`, 1200, 1500, "centre");
await make("32430984", `${P}dryfruit-detail.jpg`, 1200, 1500, "centre");
await make("5252192", `${P}jaggery-detail.jpg`, 1200, 1500, "centre");

await make("32430984", `${E}hero.jpg`, 1500, 1875, "centre");
await make("33662910", `${E}pod.jpg`, 1200, 1500, "centre");
await make("4157763", `${E}beans.jpg`, 1400, 1000, "centre");
await make("5252192", `${E}bean-macro.jpg`, 1200, 900, "centre");
await make("9615877", `${E}nuts.jpg`, 1000, 1000, "centre");
await make("37863445", `${E}jaggery.jpg`, 1000, 1000, "centre");
await make("6167328", `${E}bar-paper.jpg`, 1200, 1500, "centre");
await make("9501655", `${E}atelier.jpg`, 1400, 1000, "centre");
await make("7134663", `${E}dark-pistachio.jpg`, 1400, 1000, "centre");
await make("4113363", `${E}collection.jpg`, 1400, 1000, "centre");

console.log("done");
