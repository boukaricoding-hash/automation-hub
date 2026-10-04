import Link from "next/link";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold">Connexion requise</h1>
        <p className="mt-2">Connecte-toi pour accéder à cette page.</p>
        <Link href="/" className="mt-4 inline-block underline">
          ← Retour à l'accueil
        </Link>
      </main>
    );
  }

  if (session.user.role !== "admin") {
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

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold">Administration</h1>
      <p className="mt-2">Bienvenue, {session.user.name}.</p>
    </main>
  );
}