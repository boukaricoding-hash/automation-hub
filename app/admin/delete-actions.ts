"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { getAutomationBySlug, deleteAutomation } from "@/data/db";

export async function removeAutomation(
  slug: string
): Promise<{ error?: string }> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "admin") {
    return { error: "Action réservée aux administrateurs." };
  }

  if (!(await getAutomationBySlug(slug))) {
    return { error: "Automatisation introuvable." };
  }

  const ok = await deleteAutomation(slug);
  if (!ok) {
    return { error: "La suppression n'a pas pu être effectuée." };
  }

  redirect("/");
}