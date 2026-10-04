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
      className="mt-6 inline-block rounded-lg bg-white px-5 py-3 font-semibold text-black disabled:opacity-50"
    >
      {session
        ? `⬇️ Télécharger le fichier .${fileType}`
        : "🔐 Se connecter pour télécharger"}
    </button>
  );
}