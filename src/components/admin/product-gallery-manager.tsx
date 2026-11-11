"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from "lucide-react";
import {
  addProductImageAction,
  deleteProductImageAction,
  moveProductImageAction,
} from "@/app/admin/(dashboard)/actions";
import { moveGalleryItem, type GalleryImageRecord } from "@/lib/gallery";
import {
  MAX_IMAGE_UPLOAD_BYTES,
  MEDIA_ACCEPT,
  formatFileSize,
  imageMimeTypeAllowed,
} from "@/lib/media";
import { useProductForm } from "./product-form-provider";

type Mode = "idle" | "uploading" | "ordering" | "deleting";

export function ProductGalleryManager({
  productId,
  images: initialImages,
}: {
  productId: string | null;
  images: GalleryImageRecord[];
}) {
  const [images, setImages] = useState<GalleryImageRecord[]>(initialImages);
  const [mode, setMode] = useState<Mode>("idle");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const { beginUpload, endUpload } = useProductForm();
  const busy = mode !== "idle";

  function openPicker() {
    if (!busy) fileRef.current?.click();
  }

  async function addFiles(files: File[]) {
    if (!productId || files.length === 0) return;

    setError("");
    setStatus("");

    const accepted: File[] = [];
    const rejected: string[] = [];

    for (const file of files) {
      if (!imageMimeTypeAllowed(file.type)) {
        rejected.push(`${file.name}: use a JPEG, PNG, WebP or AVIF image.`);
      } else if (file.size === 0) {
        rejected.push(`${file.name}: the file is empty.`);
      } else if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
        rejected.push(
          `${file.name}: ${formatFileSize(file.size)}. Choose one under ${formatFileSize(MAX_IMAGE_UPLOAD_BYTES)}.`,
        );
      } else {
        accepted.push(file);
      }
    }

    if (accepted.length === 0) {
      setError(rejected.join(" "));
      return;
    }

    setMode("uploading");
    beginUpload();
    let added = 0;

    try {
      for (let index = 0; index < accepted.length; index += 1) {
        const file = accepted[index];
        setProgress(`Uploading ${index + 1} of ${accepted.length}…`);

        try {
          const body = new FormData();
          body.append("file", file);

          const response = await fetch("/api/admin/uploads", { method: "POST", body });
          const payload = (await response.json().catch(() => null)) as
            | { url?: string; error?: string }
            | null;

          if (!response.ok || !payload?.url) {
            throw new Error(payload?.error ?? "The image could not be uploaded.");
          }

          const result = await addProductImageAction({
            productId,
            url: payload.url,
            alt: file.name.replace(/\.[^.]+$/, "").slice(0, 160),
          });

          if (!result.ok) throw new Error(result.error);

          added += 1;
          setImages(result.images);
        } catch (uploadError) {
          rejected.push(
            `${file.name}: ${uploadError instanceof Error ? uploadError.message : "upload failed."}`,
          );
        }
      }

      if (added > 0) {
        setStatus(`Added ${added} image${added === 1 ? "" : "s"} to the gallery.`);
      }
      if (rejected.length > 0) setError(rejected.join(" "));
    } finally {
      setMode("idle");
      setProgress("");
      endUpload();
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function move(imageId: string, direction: "up" | "down") {
    if (!productId) return;

    const previous = images;
    const optimistic = moveGalleryItem(images, imageId, direction);
    if (optimistic === previous) return;

    setError("");
    setStatus("");
    setImages(optimistic);
    setMode("ordering");

    try {
      const result = await moveProductImageAction({ productId, imageId, direction });
      if (!result.ok) throw new Error(result.error);
      setImages(result.images);
    } catch (moveError) {
      setImages(previous);
      setError(
        moveError instanceof Error ? moveError.message : "The order could not be saved.",
      );
    } finally {
      setMode("idle");
    }
  }

  async function remove(image: GalleryImageRecord, index: number) {
    if (!productId) return;
    if (!window.confirm(`Remove image ${index + 1} from the gallery?`)) return;

    const previous = images;
    setError("");
    setStatus("");
    setImages(previous.filter((item) => item.id !== image.id));
    setMode("deleting");

    try {
      const result = await deleteProductImageAction({ imageId: image.id });
      if (!result.ok) throw new Error(result.error);
      setImages(result.images);
      setStatus("Image removed.");
    } catch (deleteError) {
      setImages(previous);
      setError(
        deleteError instanceof Error ? deleteError.message : "The image could not be removed.",
      );
    } finally {
      setMode("idle");
    }
  }

  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-ink-2">
            Gallery
          </h3>
          <p className="mt-1 text-[11px] leading-snug text-ink-2">
            Extra shots shown after the main image, in this order.
          </p>
        </div>
        {productId ? (
          <button
            type="button"
            onClick={openPicker}
            disabled={busy}
            className="btn btn-outline btn-sm shrink-0"
          >
            {mode === "uploading" ? (
              <Loader2 size={13} className="animate-spin" aria-hidden />
            ) : (
              <ImagePlus size={13} aria-hidden />
            )}
            {mode === "uploading" ? "Uploading…" : "Add images"}
          </button>
        ) : null}
      </div>

      {!productId ? (
        <div className="mt-3 border border-dashed border-line bg-paper-2 px-3 py-4">
          <p className="text-[11.5px] leading-relaxed text-ink-2">
            Save the product first, then reopen it to add a gallery.
          </p>
        </div>
      ) : images.length === 0 ? (
        <button
          type="button"
          onClick={openPicker}
          disabled={busy}
          className="mt-3 flex w-full flex-col items-center justify-center gap-1.5 border border-dashed border-line bg-paper-2 px-3 py-8 text-center transition-colors hover:border-ink-2 disabled:opacity-60"
        >
          <ImagePlus size={18} className="text-ink-2" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
            Add gallery images
          </span>
          <span className="text-[10.5px] text-ink-2">
            JPEG, PNG, WebP or AVIF · {formatFileSize(MAX_IMAGE_UPLOAD_BYTES)} each
          </span>
        </button>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-2" aria-busy={busy}>
          {images.map((image, index) => (
            <li key={image.id} className="border border-line bg-paper-2 p-1.5">
              <div className="relative aspect-[4/5] overflow-hidden border border-line bg-cream">
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="140px"
                  className="object-cover"
                />
                <span className="absolute left-1 top-1 bg-paper/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-2">
                  {index + 1}
                </span>
              </div>

              <div className="mt-1.5 flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => void move(image.id, "up")}
                    disabled={busy || index === 0}
                    aria-label={`Move image ${index + 1} up`}
                    className="flex size-7 items-center justify-center border border-line text-ink-2 transition-colors hover:border-ink-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ArrowUp size={12} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => void move(image.id, "down")}
                    disabled={busy || index === images.length - 1}
                    aria-label={`Move image ${index + 1} down`}
                    className="flex size-7 items-center justify-center border border-line text-ink-2 transition-colors hover:border-ink-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ArrowDown size={12} aria-hidden />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(image, index)}
                  disabled={busy}
                  aria-label={`Remove image ${index + 1}`}
                  className="flex size-7 items-center justify-center border border-line text-burgundy transition-colors hover:border-burgundy disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <Trash2 size={13} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        accept={MEDIA_ACCEPT}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        onChange={(event) => {
          void addFiles(Array.from(event.target.files ?? []));
        }}
      />

      <div aria-live="polite">
        {progress ? <p className="mt-2 text-[11px] text-ink-2">{progress}</p> : null}
        {status ? <p className="mt-2 text-[11px] leading-snug text-[#3c4b33]">{status}</p> : null}
        {error ? (
          <p role="alert" className="mt-2 text-[11px] leading-snug text-burgundy">
            {error}
          </p>
        ) : null}
      </div>

      {productId && images.length > 0 ? (
        <p className="hint">
          Use the arrows to set the order. The main image is always the cover; this gallery
          follows it on the product page.
        </p>
      ) : null}
    </div>
  );
}
