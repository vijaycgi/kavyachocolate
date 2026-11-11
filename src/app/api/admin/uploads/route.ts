import { NextResponse } from "next/server";
import sharp from "sharp";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ALLOWED_IMAGE_FORMATS,
  MAX_IMAGE_EDGE,
  MAX_IMAGE_INPUT_PIXELS,
  MAX_IMAGE_UPLOAD_BYTES,
  formatFileSize,
  mediaUrl,
  sanitizeFilename,
} from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function deny(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  // Cookie auth keeps this admin-only, but check Origin too so a cross-site
  // form or fetch cannot use a signed-in admin's browser as a proxy.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return deny("That request came from another site.", 403);
  }

  const admin = await getAdmin();
  if (!admin) {
    return deny("Your admin session has expired. Sign in again.", 401);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return deny("The upload could not be read. Try a smaller image.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return deny("Choose an image file to upload.", 400);
  }

  if (file.size === 0) {
    return deny("That file is empty.", 400);
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return deny(
      `That image is ${formatFileSize(file.size)}. Upload one under ${formatFileSize(MAX_IMAGE_UPLOAD_BYTES)}.`,
      413,
    );
  }

  const input = Buffer.from(await file.arrayBuffer());

  // Read only the header first. This rejects renamed text files and formats
  // sharp cannot decode before we spend time on a full render.
  let format: string | undefined;
  try {
    const metadata = await sharp(input, {
      limitInputPixels: MAX_IMAGE_INPUT_PIXELS,
    }).metadata();
    format = metadata.format;
  } catch {
    return deny("That file is not a readable image.", 415);
  }

  if (!format || !ALLOWED_IMAGE_FORMATS.has(format)) {
    return deny("Upload a JPEG, PNG, WebP or AVIF image.", 415);
  }

  let output: Buffer;
  let width: number | null = null;
  let height: number | null = null;
  try {
    const result = await sharp(input, { limitInputPixels: MAX_IMAGE_INPUT_PIXELS })
      // Auto-orient from EXIF, cap the long edge, and normalise to WebP so the
      // stored bytes are small, predictable and free of metadata.
      .rotate()
      .resize({
        width: MAX_IMAGE_EDGE,
        height: MAX_IMAGE_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    output = result.data;
    width = result.info.width ?? null;
    height = result.info.height ?? null;
  } catch {
    return deny("That image could not be processed. Try exporting it as JPEG or PNG.", 422);
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: sanitizeFilename(file.name),
      mimeType: "image/webp",
      sizeBytes: output.byteLength,
      width,
      height,
      data: new Uint8Array(output),
    },
    select: { id: true },
  });

  return NextResponse.json(
    {
      url: mediaUrl(asset.id),
      width,
      height,
      sizeBytes: output.byteLength,
      mimeType: "image/webp",
    },
    { status: 201 },
  );
}
