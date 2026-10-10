import { recordView } from "@/data/db";

export const dynamic = "force-dynamic";

// Compte une ouverture de fiche : POST /api/view avec { "slug": "afficher-ip" }
// Une même personne ne compte qu'une vue par fiche et par heure (grâce à un cookie).
export async function POST(req: Request) {
  let slug = "";
  try {
    const body = (await req.json()) as { slug?: unknown };
    slug = typeof body.slug === "string" ? body.slug.slice(0, 60) : "";
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return Response.json({ error: "slug invalide" }, { status: 400 });
  }

  // Déjà compté dans la dernière heure : on ne recompte pas
  const cookieName = `v_${slug}`;
  const cookies = req.headers.get("cookie") ?? "";
  if (cookies.split(";").some((c) => c.trim().startsWith(`${cookieName}=`))) {
    return Response.json({ ok: true, counted: false });
  }

  await recordView(slug);
  return Response.json(
    { ok: true, counted: true },
    {
      headers: {
        "Set-Cookie": `${cookieName}=1; Max-Age=3600; Path=/; HttpOnly; SameSite=Lax`,
      },
    }
  );
}