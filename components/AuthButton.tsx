"use client";

import { authClient } from "@/lib/auth-client";

export default function AuthButton() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  if (!session) {
    return (
      <button
        onClick={() =>
          authClient.signIn.social({ provider: "google", callbackURL: "/" })
        }
        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black"
      >
        Se connecter avec Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span>{session.user.name}</span>
      <button
        onClick={() =>
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                window.location.href = "/";
              },
            },
          })
        }
        className="rounded-lg border border-gray-600 px-3 py-1"
      >
        Se déconnecter
      </button>
    </div>
  );
}