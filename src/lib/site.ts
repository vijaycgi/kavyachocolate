/**
 * Absolute origin for metadata, canonicals, sitemap and JSON-LD.
 *
 * `NEXT_PUBLIC_SITE_URL` wins when set. On Vercel we fall back to the
 * deployment's own production domain so previews and production never
 * advertise `localhost` if the variable is missing.
 */
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();
