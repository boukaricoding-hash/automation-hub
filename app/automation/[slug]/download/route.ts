import { getAutomationBySlug, recordDownload } from "@/data/db";
import { getAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response("Connecte-toi pour télécharger ce fichier.", {
      status: 401,
    });
  }

  const { slug } = await params;
  const automation = await getAutomationBySlug(slug);

  if (!automation || !automation.code) {
    return new Response("Automatisation introuvable", { status: 404 });
  }
  await recordDownload(slug);
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