import Link from "next/link";
import { notFound } from "next/navigation";
import { getAutomationBySlug } from "@/data/db";

export const dynamic = "force-dynamic";

export default async function AutomationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const automation = await getAutomationBySlug(slug);

  if (!automation) notFound();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/" className="text-sm underline">
        ← Retour
      </Link>

      <h1 className="mt-4 text-3xl font-bold">{automation.title}</h1>
      <p className="mt-2 text-sm">{automation.level}</p>

      <p className="mt-6">{automation.description}</p>

      <div className="mt-6 space-y-2 rounded-lg border border-gray-600 p-4">
        <p>📄 Type de fichier : .{automation.fileType}</p>
        <p>💻 Plateforme : {automation.platform}</p>
        <p>🧰 Prérequis : {automation.requirements}</p>
      </div>

      <div className="mt-6 rounded-lg border border-yellow-500 p-4 md:hidden">
        <p className="font-semibold">📱 Tu es sur téléphone ?</p>
        <p className="mt-1 text-sm">
          Cette automatisation se lance sur un ordinateur. Ouvre cette page
          depuis ton PC pour la télécharger.
        </p>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold">🔍 Voir le code avant de le lancer</h2>
        <p className="mt-1 text-sm">
          Tu peux lire exactement ce que fait ce fichier avant de le
          télécharger.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-gray-600 p-4 text-sm">
          {automation.code}
        </pre>
      </div>
    </main>
  );
}