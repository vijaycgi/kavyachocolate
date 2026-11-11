-- Admin-uploaded product photography. Binaries are stored in Postgres so the
-- feature works on Vercel without an external object store. Assets are
-- immutable and served from /api/media/[id] with a long-lived cache header.

CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MediaAsset_createdAt_idx" ON "MediaAsset"("createdAt");
