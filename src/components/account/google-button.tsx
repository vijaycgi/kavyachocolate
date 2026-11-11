import Link from "next/link";
import { GoogleIcon } from "@/components/account/google-icon";

export function GoogleButton({
  configured,
  label = "Continue with Google",
  link = false,
}: {
  configured: boolean;
  label?: string;
  link?: boolean;
}) {
  if (!configured) {
    return (
      <div>
        <button
          type="button"
          disabled
          className="btn btn-outline w-full opacity-55"
          aria-describedby="google-status"
        >
          <GoogleIcon />
          {label}
        </button>
        <p id="google-status" className="hint">
          Google sign-in is not configured on this deployment. Add
          <code className="mx-1 rounded bg-paper-2 px-1 py-0.5 text-[11px]">GOOGLE_CLIENT_ID</code>
          and
          <code className="mx-1 rounded bg-paper-2 px-1 py-0.5 text-[11px]">GOOGLE_CLIENT_SECRET</code>
          to enable it.
        </p>
      </div>
    );
  }

  return (
    <Link href={`/api/auth/google/start${link ? "?link=1" : ""}`} className="btn btn-outline w-full">
      <GoogleIcon />
      {label}
    </Link>
  );
}
