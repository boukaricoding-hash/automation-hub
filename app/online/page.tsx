import Link from "next/link";

export const metadata = {
  title: "Outils · Automation Hub",
};

export default function OnlinePage() {
  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* En-tête : retour vers l'accueil */}
      <header className="mx-auto flex w-full max-w-7xl shrink-0 items-center justify-between gap-3 px-4 py-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-sm bg-surface px-4 py-2.5 text-sm font-semibold text-secondary shadow-sm transition hover:bg-secondary hover:text-on-secondary"
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

        <span className="font-heading text-base uppercase tracking-wide text-secondary sm:text-xl">
          Automation <span className="text-primary">Hub</span>
        </span>
      </header>

      {/* Contenu : texte en haut, robot au milieu, pastille en bas. Aucun défilement. */}
      <section className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 pb-6 sm:px-8 lg:px-12">
        {/* Texte */}
        <div className="shrink-0">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <p className="font-heading text-xs uppercase tracking-[0.18em] text-primary sm:text-sm">
              Directement sur le site
            </p>
          </div>

          <h1 className="mt-2 text-4xl text-secondary sm:text-5xl lg:text-6xl">Outils</h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground sm:text-base">
            Convertir, fusionner, transformer tes fichiers depuis ton ordinateur ou
            ton téléphone, sans rien installer.
          </p>
        </div>

        {/* Animations du robot */}
        <style>{`
          @keyframes rb-bob    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
          @keyframes rb-blink  { 0%,92%,100% { transform: scaleY(1); } 96% { transform: scaleY(0.1); } }
          @keyframes rb-spin   { to { transform: rotate(360deg); } }
          @keyframes rb-wave   { 0%,100% { transform: rotate(-12deg); } 50% { transform: rotate(18deg); } }
          @keyframes rb-ping   { 0%,100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
          @keyframes rb-dot    { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } }
          @keyframes rb-shadow { 0%,100% { transform: scaleX(1); opacity: 0.18; } 50% { transform: scaleX(0.82); opacity: 0.1; } }
          @keyframes rb-float  { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(18deg); } }
          @keyframes rb-pulse  { 0%,100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.15); } }

          .rb-bob    { animation: rb-bob 3.2s ease-in-out infinite; }
          .rb-eye    { transform-box: fill-box; transform-origin: center; animation: rb-blink 4s ease-in-out infinite; }
          .rb-spin   { transform-box: fill-box; transform-origin: center; animation: rb-spin 6s linear infinite; }
          .rb-wave   { transform-origin: 162px 162px; animation: rb-wave 1.4s ease-in-out infinite; }
          .rb-ping   { transform-box: fill-box; transform-origin: center; animation: rb-ping 1.6s ease-in-out infinite; }
          .rb-dot    { animation: rb-dot 1.2s ease-in-out infinite; }
          .rb-shadow { transform-box: fill-box; transform-origin: center; animation: rb-shadow 3.2s ease-in-out infinite; }
          .rb-float  { animation: rb-float 4s ease-in-out infinite; }
          .rb-pulse  { animation: rb-pulse 1.6s ease-in-out infinite; }

          @media (prefers-reduced-motion: reduce) {
            .rb-bob, .rb-eye, .rb-spin, .rb-wave, .rb-ping, .rb-dot, .rb-shadow, .rb-float, .rb-pulse { animation: none; }
          }
        `}</style>

        {/* Robot : prend toute la place restante, se redimensionne tout seul */}
        <div className="relative my-2 min-h-0 flex-1">
          <svg
            viewBox="0 0 240 240"
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label="Robot en cours de développement"
          >
            {/* Ombre au sol */}
            <ellipse className="rb-shadow" cx="120" cy="228" rx="48" ry="6" fill="var(--color-secondary)" />

            {/* Petits éléments qui flottent autour */}
            <g transform="translate(34 72)">
              <g className="rb-float">
                <path d="M0 -7V7M-7 0H7" stroke="#F5B544" strokeWidth="3" strokeLinecap="round" />
              </g>
            </g>
            <g transform="translate(208 54)">
              <g className="rb-float" style={{ animationDelay: "0.8s" }}>
                <path d="M0 -7V7M-7 0H7" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
              </g>
            </g>
            <g transform="translate(26 150)">
              <g className="rb-float" style={{ animationDelay: "1.6s" }}>
                <circle r="6" fill="none" stroke="var(--color-primary)" strokeOpacity="0.5" strokeWidth="3" />
              </g>
            </g>

            {/* Le robot (flotte doucement) */}
            <g className="rb-bob">
              {/* Antenne */}
              <line x1="120" y1="36" x2="120" y2="58" stroke="var(--color-secondary)" strokeWidth="5" strokeLinecap="round" />
              <circle className="rb-ping" cx="120" cy="30" r="8" fill="var(--color-primary)" />

              {/* Oreilles */}
              <rect x="46" y="88" width="14" height="28" rx="7" fill="var(--color-primary)" />
              <rect x="180" y="88" width="14" height="28" rx="7" fill="var(--color-primary)" />

              {/* Tête + écran */}
              <rect x="58" y="56" width="124" height="88" rx="28" fill="var(--color-secondary)" />
              <rect x="72" y="70" width="96" height="60" rx="20" fill="#ffffff" fillOpacity="0.1" />

              {/* Yeux qui clignent */}
              <ellipse className="rb-eye" cx="100" cy="96" rx="9" ry="10" fill="#F5B544" />
              <ellipse className="rb-eye" cx="140" cy="96" rx="9" ry="10" fill="#F5B544" />

              {/* Trois points de chargement */}
              <circle className="rb-dot" cx="108" cy="118" r="3" fill="#ffffff" />
              <circle className="rb-dot" cx="120" cy="118" r="3" fill="#ffffff" style={{ animationDelay: "0.2s" }} />
              <circle className="rb-dot" cx="132" cy="118" r="3" fill="#ffffff" style={{ animationDelay: "0.4s" }} />

              {/* Corps */}
              <rect x="78" y="150" width="84" height="56" rx="18" fill="var(--color-secondary)" />
              <rect x="96" y="162" width="48" height="32" rx="10" fill="#ffffff" fillOpacity="0.1" />

              {/* Engrenage qui tourne */}
              <g transform="translate(120 178)">
                <g className="rb-spin">
                  <circle r="9" fill="none" stroke="#F5B544" strokeWidth="5" strokeDasharray="3.5 3.57" />
                  <circle r="4" fill="var(--color-primary)" />
                </g>
              </g>

              {/* Bras gauche */}
              <line x1="80" y1="162" x2="60" y2="188" stroke="var(--color-secondary)" strokeWidth="10" strokeLinecap="round" />
              <circle cx="58" cy="191" r="7" fill="var(--color-primary)" />

              {/* Bras droit qui fait coucou */}
              <g className="rb-wave">
                <line x1="162" y1="162" x2="188" y2="146" stroke="var(--color-secondary)" strokeWidth="10" strokeLinecap="round" />
                <circle cx="191" cy="143" r="7" fill="var(--color-primary)" />
              </g>

              {/* Jambes */}
              <rect x="96" y="206" width="18" height="12" rx="6" fill="var(--color-secondary)" />
              <rect x="126" y="206" width="18" height="12" rx="6" fill="var(--color-secondary)" />
            </g>
          </svg>
        </div>

        {/* Une seule pastille sous le robot (plus de texte répété) */}
        <div className="flex shrink-0 justify-center">
          <span className="inline-flex items-center gap-2 rounded-sm bg-secondary px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-secondary sm:text-sm">
            <span className="rb-pulse h-2 w-2 rounded-full bg-[#F5B544]" />
            En développement
          </span>
        </div>
      </section>
    </main>
  );
}