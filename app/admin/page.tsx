import Link from "next/link";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getAutomationStats, getSearchStats } from "@/data/db";
import AdminForm from "@/components/AdminForm";

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

  const [stats, topSearches, emptySearches] = await Promise.all([
    getAutomationStats(),
    getSearchStats(false),
    getSearchStats(true),
  ]);

  return (
    <main className="mx-auto max-w-2xl p-6">
            <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 rounded-sm bg-surface px-4 py-2.5 text-sm font-semibold text-secondary shadow-sm transition hover:bg-secondary hover:text-on-secondary"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5" />
          <path d="M11 6l-6 6 6 6" />
        </svg>
        Retour à l&apos;accueil
      </Link>
      <h1 className="text-3xl font-bold">Administration</h1>
      <p className="mt-2">Bienvenue, {session.user.name}.</p>

      <h2 className="mt-8 text-xl font-semibold">Statistiques</h2>
      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-strong">
            <th className="py-2 pr-4">Automatisation</th>
            <th className="py-2 pr-4">Niveau</th>
            <th className="py-2 pr-4 text-right">Vues</th>
            <th className="py-2 text-right">Téléch.</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.slug} className="border-b border-border">
              <td className="py-2 pr-4">{s.title}</td>
              <td className="py-2 pr-4">{s.level}</td>
              <td className="py-2 pr-4 text-right">{s.views}</td>
              <td className="py-2 text-right">{s.downloads}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-12 text-xl font-semibold">Recherches sans résultat</h2>
      <p className="mt-1 text-sm">
        Ce que les visiteurs cherchent et que tu n'as pas encore : idées de
        prochaines automatisations et de vidéos.
      </p>
      {emptySearches.length === 0 ? (
        <p className="mt-4 text-sm">Aucune recherche pour l'instant.</p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-strong">
              <th className="py-2 pr-4">Mot cherché</th>
              <th className="py-2 text-right">Fois</th>
            </tr>
          </thead>
          <tbody>
            {emptySearches.map((s) => (
              <tr key={s.term} className="border-b border-border">
                <td className="py-2 pr-4">{s.term}</td>
                <td className="py-2 text-right">{s.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mt-12 text-xl font-semibold">Recherches les plus fréquentes</h2>
      {topSearches.length === 0 ? (
        <p className="mt-4 text-sm">Aucune recherche pour l'instant.</p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-strong">
              <th className="py-2 pr-4">Mot cherché</th>
              <th className="py-2 text-right">Fois</th>
            </tr>
          </thead>
          <tbody>
            {topSearches.map((s) => (
              <tr key={s.term} className="border-b border-border">
                <td className="py-2 pr-4">{s.term}</td>
                <td className="py-2 text-right">{s.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mt-12 text-xl font-semibold">Ajouter une automatisation</h2>
      <AdminForm />
    </main>
  );
}