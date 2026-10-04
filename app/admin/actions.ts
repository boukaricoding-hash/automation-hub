"use server";

import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { createAutomation, getAutomationBySlug } from "@/data/db";

export type FormState = { error?: string; success?: string };

const LEVELS = ["Débutant", "Intermédiaire", "Avancé"];
const FILE_TYPES = ["bat", "py", "ps1", "sh"];
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function addAutomation(
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

  if (!title || title.length > 100) {
    return { error: "Le titre est obligatoire (100 caractères maximum)." };
  }
  if (!SLUG_RE.test(slug) || slug.length > 60) {
    return {
      error:
        "Slug invalide : minuscules, chiffres et tirets seulement (ex : eteindre-pc).",
    };
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
  if (!code.trim() || code.length > 20000) {
    return { error: "Le code est obligatoire (20 000 caractères maximum)." };
  }

  const existing = await getAutomationBySlug(slug);
  if (existing) {
    return { error: "Ce slug existe déjà. Choisis-en un autre." };
  }

  await createAutomation({
    slug,
    title,
    description,
    level,
    fileType,
    platform,
    requirements,
    code,
  });

  return { success: `Automatisation « ${title} » ajoutée.` };
}