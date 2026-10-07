import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getAutomationBySlug } from "@/data/db";
import EditForm from "@/components/EditForm";

export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "admin") {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p className="mt-2">Cette page est réservée aux administrateurs.</p>
        <Link href="/" className="mt-4 inline-block underline">
          ← Retour à l'accueil
        </Link>
      </main>
    );
  }

  const automation = await getAutomationBySlug(slug);
  if (!automation) notFound();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold">Modifier l'automatisation</h1>
      <EditForm automation={automation} />
    </main>
  );
}