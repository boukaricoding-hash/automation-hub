"use client";

import { useState } from "react";
import Link from "next/link";
import type { Automation } from "@/data/db";
import AuthButton from "@/components/AuthButton";

const levels = ["Toutes", "Débutant", "Intermédiaire", "Avancé"];

export default function HomeClient({
  automations,
}: {
  automations: Automation[];
}) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("Toutes");

  const filtered = automations.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchLevel = level === "Toutes" || a.level === level;
    return matchSearch && matchLevel;
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">AUTOMATION HUB</h1>
        <AuthButton />
      </div>
      <input
        type="text"
        placeholder="🔎 Rechercher une automatisation"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-6 w-full rounded-lg border border-gray-600 bg-transparent p-3"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {levels.map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`rounded-full border px-4 py-1 ${
              level === l ? "bg-white text-black" : "border-gray-600"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {filtered.map((a) => (
          <div key={a.id} className="rounded-lg border border-gray-600 p-4">
            <h2 className="text-lg font-semibold">📁 {a.title}</h2>
            <p className="mt-1 text-sm">{a.level}</p>
            <Link
              href={`/automation/${a.slug}`}
              className="mt-3 inline-block rounded bg-white px-3 py-1 text-black"
            >
              Voir l'automatisation
            </Link>
          </div>
        ))}
        {filtered.length === 0 && <p>Aucune automatisation trouvée.</p>}
      </div>
    </main>
  );
}