"use client";

import { useActionState } from "react";
import { addAutomation, type FormState } from "@/app/admin/actions";

const initialState: FormState = {};

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-600 bg-transparent p-2";

export default function AdminForm() {
  const [state, formAction, pending] = useActionState(
    addAutomation,
    initialState
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        Titre
        <input name="title" required maxLength={100} className={inputClass} />
      </label>

      <label className="block">
        Slug (adresse, ex : eteindre-pc)
        <input name="slug" required maxLength={60} className={inputClass} />
      </label>

      <label className="block">
        Description
        <textarea
          name="description"
          required
          maxLength={500}
          rows={3}
          className={inputClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          Niveau
          <select name="level" className={inputClass}>
            <option className="text-black">Débutant</option>
            <option className="text-black">Intermédiaire</option>
            <option className="text-black">Avancé</option>
          </select>
        </label>

        <label className="block">
          Type de fichier
          <select name="fileType" className={inputClass}>
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
        Plateforme (ex : Windows)
        <input name="platform" required className={inputClass} />
      </label>

      <label className="block">
        Prérequis (ex : Aucun)
        <input name="requirements" required className={inputClass} />
      </label>

      <label className="block">
        Code du script
        <textarea
          name="code"
          required
          rows={10}
          className={`${inputClass} font-mono text-sm`}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-white px-5 py-2 font-semibold text-black disabled:opacity-50"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>

      {state.error && <p className="text-red-400">{state.error}</p>}
      {state.success && <p className="text-green-400">{state.success}</p>}
    </form>
  );
}