import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Cuid-sized ids only. Anything else is a 404 before touching the database.
const MEDIA_ID = /^[a-z0-9]{20,32}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!MEDIA_ID.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { data: true, mimeType: true, sizeBytes: true },
  });

  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.sizeBytes),
      // Assets are immutable: the id is created once and never rewritten.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
