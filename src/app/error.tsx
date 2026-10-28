"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-5 max-w-[18ch] font-display text-4xl leading-[1.08] sm:text-5xl">
        We could not finish that.
      </h1>
      <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-ink-2">
        The order or page may still be safe. Try again, or return to the collection. If you were
        placing an order, no payment has been taken online.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/shop" className="btn btn-outline">
          Back to the shop
        </Link>
      </div>
    </main>
  );
}
