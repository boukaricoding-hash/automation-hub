import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import {
  deleteReview,
  getAutomationBySlug,
  getReviews,
  saveReview,
} from "@/data/db";

export const dynamic = "force-dynamic";

async function getSession() {
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
}

// Lire les avis d'une automatisation : GET /api/reviews?slug=afficher-ip
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return Response.json({ error: "slug manquant" }, { status: 400 });
  const reviews = await getReviews(slug);
  return Response.json({ reviews });
}

// Laisser un avis (connexion obligatoire)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Connecte-toi pour laisser un avis." }, { status: 401 });
  }

  let body: { slug?: unknown; rating?: unknown; comment?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug : "";
  const rating = Number(body.rating);
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";

  if (!slug || !(await getAutomationBySlug(slug))) {
    return Response.json({ error: "Automatisation introuvable." }, { status: 404 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: "La note doit être entre 1 et 5." }, { status: 400 });
  }
  if (comment.length < 3 || comment.length > 500) {
    return Response.json(
      { error: "Le commentaire doit faire entre 3 et 500 caractères." },
      { status: 400 }
    );
  }

  await saveReview({
    slug,
    userId: session.user.id,
    userName: session.user.name || "Anonyme",
    rating,
    comment,
  });
  return Response.json({ ok: true });
}

// Supprimer un avis : l'admin peut tout supprimer, chacun peut supprimer le sien
export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Non connecté." }, { status: 401 });

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) {
    return Response.json({ error: "id invalide." }, { status: 400 });
  }

  const isAdmin = session.user.role === "admin";
  const done = await deleteReview(id, isAdmin ? undefined : session.user.id);
  if (!done) return Response.json({ error: "Avis introuvable." }, { status: 404 });
  return Response.json({ ok: true });
}