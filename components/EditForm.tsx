"use client";

import Link from "next/link";
import { useActionState } from "react";
import { editAutomation } from "@/app/admin/edit-actions";
import type { FormState } from "@/app/admin/actions";
import type { Automation } from "@/data/db";

const initialState: FormState = {};

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-600 bg-transparent p-2";

export default function EditForm({ automation }: { automation: Automation }) {
  const [state, formAction, pending] = useActionState(
    editAutomation,
    initialState
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="slug" value={automation.slug} />

      <p className="text-sm">
        Slug (non modifiable) : <code>{automation.slug}</code>
      </p>

      <label className="block">
        Titre
        <input
          name="title"
          required
          maxLength={100}
          defaultValue={automation.title}
          className={inputClass}
        />
      </label>

      <label className="block">
        Description
        <textarea
          name="description"
          required
          maxLength={500}
          rows={3}
          defaultValue={automation.description}
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          Niveau
          <select
            name="level"
            defaultValue={automation.level}
            className={inputClass}
          >
            <option className="text-black">Débutant</option>
            <option className="text-black">Intermédiaire</option>
            <option className="text-black">Avancé</option>
          </select>
        </label>

        <label className="block">
          Type de fichier
          <select
            name="fileType"
            defaultValue={automation.fileType}
            className={inputClass}
          >
            <option className="text-black" value="bat">
              .bat
            </option>
            <option className="text-black" value="py">
              .py
            </option>
            <option className="text-black" value="ps1">
              .ps1
            </option>
            <option className="text-black" value="sh">
              .sh
            </option>
          </select>
        </label>
      </div>

      <label className="block">
        Plateforme
        <input
          name="platform"
          required
          defaultValue={automation.platform}
          className={inputClass}
        />
      </label>

      <label className="block">
        Prérequis
        <input
          name="requirements"
          required
          defaultValue={automation.requirements}
          className={inputClass}
        />
      </label>

      <label className="block">
        Code du script
        <textarea
          name="code"
          required
          rows={12}
          defaultValue={automation.code ?? ""}
          className={`${inputClass} font-mono text-sm`}
        />
      </label>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-white px-5 py-2 font-semibold text-black disabled:opacity-50"
        >
          {pending ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
        <Link href={`/automation/${automation.slug}`} className="underline">
          Annuler
        </Link>
      </div>

      {state.error && <p className="text-red-400">{state.error}</p>}
    </form>
  );
}