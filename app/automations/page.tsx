import Link from "next/link";
import Image from "next/image";
import { ALL_PER_PAGE, searchAutomations } from "@/data/db";

export const dynamic = "force-dynamic";

const levelDot: Record<string, string> = {
  Débutant: "bg-success",
  Intermédiaire: "bg-warning",
  Avancé: "bg-[#7C3AED]",
};

const LEVELS = ["Débutant", "Intermédiaire", "Avancé"];

export default async function AllAutomations({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; level?: string }>;
}) {
  const { q = "", page: p, level: lv } = await searchParams;
  const level = lv && LEVELS.includes(lv) ? lv : undefined;
  const page = Math.max(parseInt(p ?? "1", 10) || 1, 1);
  const { items, total } = await searchAutomations(q, page, level);
  const pages = Math.max(Math.ceil(total / ALL_PER_PAGE), 1);

  // Adresse du catalogue en gardant la recherche et le niveau choisi
  const href = (n: number, lvl: string | undefined = level) =>
    `/automations?${new URLSearchParams({
      ...(q ? { q } : {}),
      ...(lvl ? { level: lvl } : {}),
      page: String(n),
    })}`;
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header : mêmes marges que l'accueil */}
      <header className="py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 sm:px-8 lg:px-12">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Automation Hub"
              width={44}
              height={44}
              className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
            />
            <span className="truncate font-heading text-base uppercase leading-none tracking-wide text-secondary sm:text-xl">
              Automation <span className="text-primary">Hub</span>
            </span>
          </Link>
          <Link
            href="/"
            className="shrink-0 rounded-sm bg-surface px-4 py-2 text-sm font-medium text-foreground-secondary shadow-sm transition hover:bg-secondary hover:text-on-secondary"
          >
            Accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-8 sm:pt-10 lg:px-12">
        <p className="font-heading text-xs uppercase tracking-[0.18em] text-primary sm:text-sm">
          Catalogue
        </p>
        <h1 className="mt-1 text-3xl text-secondary sm:text-5xl">Toutes les automatisations</h1>

        {/* Recherche : une simple ligne */}
        <form action="/automations" method="get" className="relative mt-6 max-w-xl">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 4a7 7 0 100 14 7 7 0 000-14z" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={q}
            autoComplete="off"
            placeholder="Rechercher par titre, catégorie…"
            className="w-full border-b border-border-strong bg-transparent py-2.5 pl-7 pr-24 text-sm text-foreground outline-none transition placeholder:text-foreground-muted focus:border-primary"
          />
          <button
            type="submit"
            className="absolute bottom-1.5 right-0 rounded-sm bg-secondary px-4 py-1.5 text-sm font-semibold text-on-secondary transition hover:opacity-90"
          >
            Chercher
          </button>
        </form>
                {/* Filtre par niveau */}
        <div className="-mx-4 mt-5 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {[undefined, ...LEVELS].map((l) => {
            const active = l === level;
            const to = `/automations?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(l ? { level: l } : {}),
              page: "1",
            })}`;
            return (
              <Link
                key={l ?? "tous"}
                href={to}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "bg-secondary text-on-secondary"
                    : "bg-surface text-foreground-secondary shadow-sm hover:text-foreground"
                }`}
              >
                {l && (
                  <span
                    className={`h-2 w-2 rounded-full ${levelDot[l] ?? "bg-foreground-muted"}`}
                  />
                )}
                {l ?? "Tous"}
              </Link>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-foreground-secondary">
          {total} automatisation{total > 1 ? "s" : ""}
          {q ? <> pour « {q} »</> : null}
          {q && (
            <Link href="/automations" className="ml-3 font-semibold text-primary hover:underline">
              Effacer
            </Link>
          )}
        </p>

        {/* Grille de cartes */}
        {items.length === 0 ? (
          <p className="mt-10 text-foreground-secondary">Aucune automatisation trouvée.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((it) => (
              <li
                key={it.key}
                className="relative flex h-full flex-col rounded-sm bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="font-heading text-[11px] uppercase tracking-[0.18em] text-primary">
                  {it.category ?? "Automatisation"}
                </p>
                <h2 className="mt-1.5 line-clamp-2 break-words text-lg leading-snug text-secondary">
                  {/* Le titre couvre toute la carte : un clic ouvre le premier niveau */}
                  <Link href={`/?a=${it.slug}`} className="after:absolute after:inset-0">
                    {it.title}
                  </Link>
                </h2>
                {it.subtitle && (
                  <p className="mt-1 line-clamp-1 text-sm text-foreground-secondary">
                    {it.subtitle}
                  </p>
                )}

                <div className="mt-auto pt-4">
                  {/* Un lien par niveau, au-dessus du lien de la carte */}
                  <div className="relative z-10 flex flex-wrap gap-1.5">
                    {it.variants.map((v) => (
                      <Link
                        key={v.slug}
                        href={`/?a=${v.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-sm bg-background-alt px-3 py-2 text-xs font-semibold text-foreground-secondary transition hover:bg-secondary hover:text-on-secondary"
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${levelDot[v.level] ?? "bg-foreground-muted"}`}
                        />
                        {v.level}
                      </Link>
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-medium text-foreground-secondary">
                    .{it.fileType} · {it.platform}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <nav className="mt-8 flex items-center justify-between gap-3" aria-label="Pagination">
            {page > 1 ? (
              <Link
                href={href(page - 1)}
                className="rounded-sm bg-surface px-4 py-2 text-sm font-semibold text-secondary shadow-sm transition hover:bg-secondary hover:text-on-secondary"
              >
                ← Précédent
              </Link>
            ) : (
              <span />
            )}
            <span className="text-sm text-foreground-secondary">
              Page {page} / {pages}
            </span>
            {page < pages ? (
              <Link
                href={href(page + 1)}
                className="rounded-sm bg-surface px-4 py-2 text-sm font-semibold text-secondary shadow-sm transition hover:bg-secondary hover:text-on-secondary"
              >
                Suivant →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </main>
    </div>
  );
}