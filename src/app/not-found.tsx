import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <Link href="/" aria-label="Kavya Chocolat — home">
        <Image
          src="/images/kavya-chocolat-logo.svg"
          alt="Kavya Chocolat"
          width={84}
          height={49}
          className="h-12 w-auto"
        />
      </Link>
      <p className="eyebrow mt-10">404 · Off the wrapper</p>
      <h1 className="mt-5 max-w-[16ch] font-display text-5xl leading-[1.05] sm:text-6xl">
        This page has melted away.
      </h1>
      <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-ink-2">
        The link may be old, or the bar may have left the collection. The four current bars are
        one click away.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn-primary">
          Shop the collection
        </Link>
        <Link href="/" className="btn btn-outline">
          Back home
        </Link>
      </div>
    </main>
  );
}
