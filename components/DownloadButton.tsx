"use client";

import { authClient } from "@/lib/auth-client";

export default function DownloadButton({
  slug,
  fileType,
}: {
  slug: string;
  fileType: string;
}) {
  const { data: session, isPending } = authClient.useSession();

  function handleClick() {
    if (session) {
      window.location.href = `/automation/${slug}/download`;
    } else {
      authClient.signIn.social({
        provider: "google",
        callbackURL: `/automation/${slug}`,
      });
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="mt-6 inline-flex items-center justify-center rounded-sm bg-secondary px-5 py-3 font-semibold text-on-secondary transition hover:bg-primary disabled:opacity-50"
    >
      {session
        ? `⬇️ Télécharger le fichier .${fileType}`
        : "🔐 Se connecter pour télécharger"}
    </button>
  );
}