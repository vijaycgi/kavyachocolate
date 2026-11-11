"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ImageIcon, ImageUp, Loader2 } from "lucide-react";
import {
  MAX_IMAGE_UPLOAD_BYTES,
  MEDIA_ACCEPT,
  formatFileSize,
  imageMimeTypeAllowed,
} from "@/lib/media";
import { useProductForm } from "./product-form-provider";

const FALLBACK_IMAGE = "/images/products/classic.jpg";

type UploadState = "idle" | "uploading" | "done";

export function ProductPhotography({
  imageUrl,
  hoverImageUrl,
}: {
  imageUrl: string;
  hoverImageUrl: string;
}) {
  const [mainImage, setMainImage] = useState(imageUrl || FALLBACK_IMAGE);
  const [mainPreview, setMainPreview] = useState(imageUrl || FALLBACK_IMAGE);
  const [detailImage, setDetailImage] = useState(hoverImageUrl);

  return (
    <>
      <div className="relative mt-3 aspect-[4/5] overflow-hidden border border-line bg-paper-2">
        <Image
          src={mainPreview || FALLBACK_IMAGE}
          alt=""
          fill
          sizes="240px"
          className="object-cover"
        />
      </div>

      <div className="mt-3 space-y-4">
        <ImageField
          label="Main image"
          name="imageUrl"
          value={mainImage}
          onChange={setMainImage}
          onPreview={setMainPreview}
          hint="Upload from this computer, or keep a local path under /public."
        />
        <ImageField
          label="Detail image"
          name="hoverImageUrl"
          value={detailImage}
          onChange={setDetailImage}
          optional
          hint="Optional. Shown when a visitor hovers the product card."
        />
        <p className="hint">
          Uploads accept JPEG, PNG, WebP or AVIF up to {formatFileSize(MAX_IMAGE_UPLOAD_BYTES)},
          are resized to 2000px and stored as WebP. Save the product to keep the new image.
        </p>
      </div>
    </>
  );
}

function ImageField({
  label,
  name,
  value,
  onChange,
  onPreview,
  optional = false,
  hint,
}: {
  label: string;
  name: "imageUrl" | "hoverImageUrl";
  value: string;
  onChange: (value: string) => void;
  onPreview?: (value: string) => void;
  optional?: boolean;
  hint: string;
}) {
  const inputId = useId();
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const { beginUpload, endUpload } = useProductForm();

  const [preview, setPreview] = useState(value);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const uploading = state === "uploading";

  function updatePreview(next: string) {
    setPreview(next);
    onPreview?.(next);
  }

  function handlePathChange(next: string) {
    onChange(next);
    updatePreview(next);
    setState("idle");
    setError("");
    setNotice("");
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setError("");
    setNotice("");

    if (!imageMimeTypeAllowed(file.type)) {
      setError("Choose a JPEG, PNG, WebP or AVIF image.");
      return;
    }

    if (file.size === 0) {
      setError("That file is empty.");
      return;
    }

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setError(
        `That image is ${formatFileSize(file.size)}. Choose one under ${formatFileSize(MAX_IMAGE_UPLOAD_BYTES)}.`,
      );
      return;
    }

    // Show the chosen file while it uploads.
    const objectUrl = URL.createObjectURL(file);
    updatePreview(objectUrl);
    setState("uploading");
    beginUpload();

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

      onChange(payload.url);
      updatePreview(payload.url);
      setState("done");
      setNotice("Uploaded. Press Save product to keep this image.");
    } catch (uploadError) {
      updatePreview(value);
      setState("idle");
      setError(
        uploadError instanceof Error ? uploadError.message : "The image could not be uploaded.",
      );
    } finally {
      URL.revokeObjectURL(objectUrl);
      endUpload();
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="label">
          {label}
          {optional ? (
            <span className="ml-1 normal-case tracking-normal text-ink-2">(optional)</span>
          ) : null}
        </label>
        <span className="text-[10px] uppercase tracking-[0.1em] text-ink-2" aria-live="polite">
          {uploading ? "Uploading…" : state === "done" ? "Uploaded" : ""}
        </span>
      </div>

      <div className="flex items-stretch gap-2">
        <span className="relative block size-11 shrink-0 overflow-hidden border border-line bg-paper-2">
          {preview ? (
            <Image src={preview} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-ink-2">
              <ImageIcon size={14} aria-hidden />
            </span>
          )}
        </span>

        <input
          id={inputId}
          name={name}
          value={value}
          disabled={uploading}
          onChange={(event) => handlePathChange(event.target.value)}
          placeholder="/images/products/classic.jpg"
          className="field min-h-11 min-w-0 flex-1 font-mono text-[11px]"
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn btn-outline btn-sm"
        >
          {uploading ? (
            <Loader2 size={13} className="animate-spin" aria-hidden />
          ) : (
            <ImageUp size={13} aria-hidden />
          )}
          {uploading ? "Uploading…" : "Browse…"}
        </button>
        <span className="text-[10.5px] leading-snug text-ink-2">
          {uploading ? "Hold on before saving." : `${formatFileSize(MAX_IMAGE_UPLOAD_BYTES)} max`}
        </span>
      </div>

      <input
        ref={fileRef}
        id={fileInputId}
        type="file"
        accept={MEDIA_ACCEPT}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
        }}
      />

      <p className="hint">{hint}</p>

      {error ? (
        <p role="alert" className="mt-1.5 text-[11px] leading-snug text-burgundy">
          {error}
        </p>
      ) : null}
      {notice && !error ? (
        <p role="status" className="mt-1.5 text-[11px] leading-snug text-[#3c4b33]">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
