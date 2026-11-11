"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Save } from "lucide-react";

type ProductFormState = {
  uploading: boolean;
  beginUpload: () => void;
  endUpload: () => void;
};

const ProductFormContext = createContext<ProductFormState | null>(null);

/**
 * Tracks in-flight image uploads so the save button can stay disabled until
 * the returned media path is in the form. Without this, pressing Save during an
 * upload would quietly persist the previous image path.
 */
export function ProductFormProvider({ children }: { children: ReactNode }) {
  const [activeUploads, setActiveUploads] = useState(0);

  const beginUpload = useCallback(() => {
    setActiveUploads((count) => count + 1);
  }, []);

  const endUpload = useCallback(() => {
    setActiveUploads((count) => Math.max(0, count - 1));
  }, []);

  const value = useMemo(
    () => ({ uploading: activeUploads > 0, beginUpload, endUpload }),
    [activeUploads, beginUpload, endUpload],
  );

  return <ProductFormContext.Provider value={value}>{children}</ProductFormContext.Provider>;
}

export function useProductForm() {
  const context = useContext(ProductFormContext);
  if (!context) {
    throw new Error("useProductForm must be used inside ProductFormProvider.");
  }
  return context;
}

export function ProductSaveButton({ isNew }: { isNew: boolean }) {
  const { uploading } = useProductForm();

  return (
    <button
      type="submit"
      disabled={uploading}
      aria-busy={uploading}
      className="btn btn-primary btn-sm w-full"
    >
      <Save size={13} aria-hidden />{" "}
      {uploading ? "Uploading image…" : isNew ? "Create product" : "Save product"}
    </button>
  );
}
