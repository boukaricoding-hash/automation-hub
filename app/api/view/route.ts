import { recordView } from "@/data/db";

export const dynamic = "force-dynamic";

// Compte une ouverture de fiche : POST /api/view avec { "slug": "afficher-ip" }
export async function POST(req: Request) {
  let slug = "";
  try {
    const body = (await req.json()) as { slug?: unknown };
    slug = typeof body.slug === "string" ? body.slug.slice(0, 60) : "";
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!slug) return Response.json({ error: "slug manquant" }, { status: 400 });

  await recordView(slug);
  return Response.json({ ok: true });
}