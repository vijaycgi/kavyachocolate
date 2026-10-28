"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartLine = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantName: string;
  sku: string;
  weightGrams: number;
  priceMinor: number;
  imageUrl: string;
  stock: number;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  hydrated: boolean;
  open: boolean;
  count: number;
  subtotalMinor: number;
  addLine: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kavya-cart-v1";

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.variantId === "string" &&
    typeof line.slug === "string" &&
    typeof line.name === "string" &&
    typeof line.priceMinor === "number" &&
    typeof line.quantity === "number" &&
    line.quantity > 0
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- The cart hydrates once from localStorage after mount. A lazy initializer would render a different count on the server and client, so the effect is the correct boundary. */
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setLines(parsed.filter(isCartLine));
      }
    } catch {
      // A blocked or corrupted store should not break the storefront.
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Ignore quota or privacy-mode failures.
    }
  }, [lines, hydrated]);

  const addLine = useCallback((line: Omit<CartLine, "quantity">, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((entry) => entry.variantId === line.variantId);
      const cap = Math.max(0, Math.min(20, line.stock));
      if (existing) {
        return current.map((entry) =>
          entry.variantId === line.variantId
            ? { ...entry, ...line, quantity: Math.min(cap, entry.quantity + quantity) }
            : entry,
        );
      }
      return [...current, { ...line, quantity: Math.min(cap, Math.max(1, quantity)) }];
    });
    setOpen(true);
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((current) =>
      current
        .map((entry) =>
          entry.variantId === variantId
            ? { ...entry, quantity: Math.min(Math.max(1, Math.min(20, entry.stock)), quantity) }
            : entry,
        )
        .filter((entry) => entry.quantity > 0),
    );
  }, []);

  const removeLine = useCallback((variantId: string) => {
    setLines((current) => current.filter((entry) => entry.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotalMinor = lines.reduce((sum, line) => sum + line.priceMinor * line.quantity, 0);
    return {
      lines,
      hydrated,
      open,
      count,
      subtotalMinor,
      addLine,
      setQuantity,
      removeLine,
      clear,
      openCart,
      closeCart,
    };
  }, [lines, hydrated, open, addLine, setQuantity, removeLine, clear, openCart, closeCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
