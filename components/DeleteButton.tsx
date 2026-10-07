"use client";

import { useState, useTransition } from "react";
import { removeAutomation } from "@/app/admin/delete-actions";

export default function DeleteButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const ok = window.confirm(
      `Supprimer « ${title} » ?\n\nCette action est définitive, et le lien de la fiche ne fonctionnera plus.`
    );
    if (!ok) return;

    setError("");
    startTransition(async () => {
      const result = await removeAutomation(slug);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={pending}
        className="rounded-lg border border-red-500 px-3 py-1 text-sm text-red-400 disabled:opacity-50"
      >
        {pending ? "Suppression..." : "🗑️ Supprimer"}
      </button>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}