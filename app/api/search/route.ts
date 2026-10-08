import { recordSearch, searchAutomations } from "@/data/db";

export const dynamic = "force-dynamic";

// Recherche dans TOUTES les automatisations : GET /api/search?q=mot
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim() === "") return Response.json({ items: [] });
  const { items, total } = await searchAutomations(q.slice(0, 80), 1);

  // Garde en mémoire ce que les visiteurs cherchent. Si ça échoue, la recherche continue.
  try {
    await recordSearch(q, total);
  } catch {}

  return Response.json({ items: items.slice(0, 6) });
}