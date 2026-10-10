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
          ← Retour à l&apos;accueil
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
          ← Retour à l&apos;accueil
        </Link>
      </main>
    );
  }

  const [stats, topSearches, emptySearches] = await Promise.all([
    getAutomationStats(),
    getSearchStats(false),
    getSearchStats(true),
  ]);

  const totalViews = stats.reduce((n, s) => n + s.views, 0);
  const totalDownloads = stats.reduce((n, s) => n + s.downloads, 0);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-8">
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

      <p className="font-heading text-xs uppercase tracking-[0.18em] text-primary sm:text-sm">
        Espace admin
      </p>
      <h1 className="mt-1 text-3xl text-secondary sm:text-5xl">Administration</h1>
      <p className="mt-2 text-foreground-secondary">Bienvenue, {session.user.name}.</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Automatisations", value: stats.length },
          { label: "Vues", value: totalViews },
          { label: "Téléchargements", value: totalDownloads },
        ].map((c) => (
          <div key={c.label} className="rounded-sm bg-surface p-3 shadow-sm sm:p-4">
            <p className="text-[11px] uppercase tracking-wide text-foreground-muted">
              {c.label}
            </p>
            <p className="mt-1 font-heading text-2xl text-secondary sm:text-3xl">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-2xl text-secondary">Statistiques</h2>
      <div className="mt-4 overflow-x-auto rounded-sm bg-surface px-4 py-2 shadow-sm">
        <table className="w-full text-left text-sm">
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
      </div>

      <h2 className="mt-12 text-2xl text-secondary">Recherches sans résultat</h2>
      <p className="mt-1 text-sm">
        Ce que les visiteurs cherchent et que tu n&apos;as pas encore : idées de
        prochaines automatisations et de vidéos.
      </p>
      {emptySearches.length === 0 ? (
        <p className="mt-4 text-sm">Aucune recherche pour l&apos;instant.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-sm bg-surface px-4 py-2 shadow-sm">
          <table className="w-full text-left text-sm">
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
        </div>
      )}

      <h2 className="mt-12 text-2xl text-secondary">Recherches les plus fréquentes</h2>
      {topSearches.length === 0 ? (
        <p className="mt-4 text-sm">Aucune recherche pour l&apos;instant.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-sm bg-surface px-4 py-2 shadow-sm">
          <table className="w-full text-left text-sm">
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
        </div>
      )}

      <h2 className="mt-12 text-2xl text-secondary">Ajouter une automatisation</h2>
      <AdminForm />
    </main>
  );
}