"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getAutomationBySlug, updateAutomation } from "@/data/db";
import type { FormState } from "@/app/admin/actions";

const LEVELS = ["Débutant", "Intermédiaire", "Avancé"];
const FILE_TYPES = ["bat", "py", "ps1", "sh"];

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function editAutomation(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "admin") {
    return { error: "Action réservée aux administrateurs." };
  }

  const slug = field(formData, "slug");
  const title = field(formData, "title");
  const description = field(formData, "description");
  const level = field(formData, "level");
  const fileType = field(formData, "fileType");
  const platform = field(formData, "platform");
  const requirements = field(formData, "requirements");
  const code = String(formData.get("code") ?? "");

  if (!(await getAutomationBySlug(slug))) {
    return { error: "Automatisation introuvable." };
  }
  if (!title || title.length > 100) {
    return { error: "Le titre est obligatoire (100 caractères maximum)." };
  }
  if (!description || description.length > 500) {
    return { error: "La description est obligatoire (500 caractères maximum)." };
  }
  if (!LEVELS.includes(level)) {
    return { error: "Niveau invalide." };
  }
  if (!FILE_TYPES.includes(fileType)) {
    return { error: "Type de fichier non autorisé." };
  }
  if (!platform || !requirements) {
    return { error: "La plateforme et les prérequis sont obligatoires." };
  }
  if (!code.trim()) {
    return { error: "Le code est obligatoire." };
  }

  const ok = await updateAutomation({
    slug,
    title,
    description,
    level,
    fileType,
    platform,
    requirements,
    code,
  });
  if (!ok) {
    return { error: "La modification n'a pas pu être enregistrée." };
  }

  redirect(`/automation/${slug}`);
}