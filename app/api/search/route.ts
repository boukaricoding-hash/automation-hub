import { searchAutomations } from "@/data/db";

export const dynamic = "force-dynamic";

// Recherche dans TOUTES les automatisations : GET /api/search?q=mot
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  if (q.trim() === "") return Response.json({ items: [] });
  const { items } = await searchAutomations(q.slice(0, 80), 1);
  return Response.json({ items: items.slice(0, 6) });
}