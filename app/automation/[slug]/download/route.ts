import { getAutomationBySlug } from "@/data/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const automation = await getAutomationBySlug(slug);

  if (!automation || !automation.code) {
    return new Response("Automatisation introuvable", { status: 404 });
  }

  const content =
    automation.fileType === "bat"
      ? automation.code.replace(/\r?\n/g, "\r\n")
      : automation.code;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.${automation.fileType}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}