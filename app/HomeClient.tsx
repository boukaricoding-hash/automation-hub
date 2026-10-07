"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import type { Automation } from "@/data/db";
import AuthButton from "@/components/AuthButton";
import DownloadButton from "@/components/DownloadButton";
import DeleteButton from "@/components/DeleteButton";

/* ════════════════════════════════════════════════════════════════════
   1. RÉGLAGES GÉNÉRAUX
   ════════════════════════════════════════════════════════════════════ */

// Image utilisée par défaut (quand une automatisation n'a pas la sienne)
const HERO_IMAGE = "/images/dossier.png";

// Courbe d'animation très douce
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

// Couleur d'appoint (ambre) pour casser le « tout orange »
const AMBER = "#F5B544";

// Ordre d'affichage des niveaux dans le sélecteur
const LEVEL_ORDER = ["Débutant", "Intermédiaire", "Avancé"];

// Petite pastille de couleur devant chaque niveau
const levelDot: Record<string, string> = {
  Débutant: "bg-success",
  Intermédiaire: "bg-warning",
  Avancé: "bg-[#7C3AED]",
};

/* ════════════════════════════════════════════════════════════════════
   1a. LES 5 ANIMATIONS D'ENTRÉE DE L'IMAGE
   ────────────────────────────────────────────────────────────────────
   Le slide n°1 utilise l'animation 1, le n°2 la 2, … le n°5 la 5,
   puis le n°6 reprend la 1, etc. (index % nombre d'animations).

   hidden : forme de départ (image invisible)
   shown  : forme d'arrivée (image entière)
   zoom   : position de départ de l'image (elle se pose doucement)

   Pour en ajouter une, copie un bloc : elles se succèdent automatiquement.
   ════════════════════════════════════════════════════════════════════ */
const REVEALS: { hidden: string; shown: string; zoom: string }[] = [
  // 1 · cercle qui s'ouvre depuis le coin en bas à gauche
  {
    hidden: "circle(0% at 0% 100%)",
    shown: "circle(170% at 0% 100%)",
    zoom: "scale(1.15)",
  },
  // 2 · balayage de la droite vers la gauche
  {
    hidden: "inset(0 0 0 100%)",
    shown: "inset(0 0 0 0%)",
    zoom: "scale(1.2) translate3d(5%, 0, 0)",
  },
  // 3 · cercle qui s'ouvre depuis le centre
  {
    hidden: "circle(0% at 50% 50%)",
    shown: "circle(150% at 50% 50%)",
    zoom: "scale(1.3)",
  },
  // 4 · balayage diagonal de la gauche vers la droite
  {
    hidden: "polygon(0 0, 0 0, -35% 100%, -35% 100%)",
    shown: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    zoom: "scale(1.2) translate3d(-5%, 0, 0)",
  },
  // 5 · rideau qui descend du haut
  {
    hidden: "inset(0 0 100% 0)",
    shown: "inset(0 0 0% 0)",
    zoom: "scale(1.2) translate3d(0, -5%, 0)",
  },
];

// Animations d'ouverture de la PAGE (fond), dans le même ordre que REVEALS
const PAGE_TRANSITIONS: { hidden: string; shown: string }[] = [
  // 1 · cercle depuis le coin en bas à gauche
  { hidden: "circle(0% at 0% 100%)", shown: "circle(160% at 0% 100%)" },
  // 2 · balayage de la droite vers la gauche
  { hidden: "inset(0 0 0 100%)", shown: "inset(0 0 0 0%)" },
  // 3 · cercle depuis le centre
  { hidden: "circle(0% at 50% 50%)", shown: "circle(150% at 50% 50%)" },
  // 4 · la page monte depuis le bas
  { hidden: "inset(100% 0 0 0)", shown: "inset(0% 0 0 0)" },
  // 5 · balayage de la gauche vers la droite
  {
    hidden: "polygon(0 0, 0 0, 0 100%, 0 100%)",
    shown: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
  },
];

// D'où arrive le texte pour chaque animation (x, y de départ)
const TEXT_FROM: { x: string; y: string }[] = [
  { x: "-40px", y: "60px" },
  { x: "60px", y: "0px" },
  { x: "0px", y: "40px" },
  { x: "0px", y: "-50px" },
  { x: "-60px", y: "0px" },
];

/* ════════════════════════════════════════════════════════════════════
   1b. MESSAGES DE BIENVENUE (visiteur connecté)
   ────────────────────────────────────────────────────────────────────
   Ajoute, retire ou modifie des phrases dans ce tableau : l'accueil en
   choisit une au hasard puis change de phrase toutes les
   WELCOME_ROTATION_MS millisecondes. Garde-les courtes (2 lignes max).
   ════════════════════════════════════════════════════════════════════ */
const WELCOME_MESSAGES = [
  "Ravi de te revoir ! Prêt à gagner du temps ?",
  "Content de te voir ici. Une tâche de moins à faire à la main !",
  "Bienvenue ! Choisis une automatisation et laisse la machine bosser.",
  "Belle journée pour automatiser. Tu vas droit au but !",
  "Heureux de t'avoir parmi nous. Prends ton temps, tout est là.",
  "Tu as fait le plus dur : venir ici. Le reste, on l'automatise.",
  "Chaque minute gagnée est une minute pour toi. Allons-y !",
];

// Durée entre deux messages (en millisecondes)
const WELCOME_ROTATION_MS = 9000;

/* ════════════════════════════════════════════════════════════════════
   2. PERSONNALISATION PAR AUTOMATISATION
   ────────────────────────────────────────────────────────────────────
   Pour changer le design d'UNE automatisation, ajoute une ligne avec
   son slug. Tout ce que tu ne précises pas garde le design par défaut.

   image : l'image de CETTE automatisation (mets-la dans /public/images)
   visual : ce qui s'affiche de l'autre côté du texte
     "image" → l'image (défaut)
     "code"  → un mini éditeur avec les premières lignes du code
     "specs" → une fiche technique en texte

   Exemple :
   "afficher-ip": {
     image: "/images/afficher-ip.png",
     imageFit: "cover",
     primary: "#2563EB",
     primaryDark: "#1D4ED8",
     secondary: "#0F172A",
     background: "#EFF6FF",
     backgroundAlt: "#DBEAFE",
     imagePosition: "left",
   },
   ════════════════════════════════════════════════════════════════════ */
type SlideDesign = {
  visual?: "image" | "code" | "specs";
  image?: string;
  imageFit?: "cover" | "contain";
  imagePosition?: "left" | "right"; // côté du visuel sur grand écran
  primary?: string; // accent (eyebrow, numéro, lignes)
  primaryDark?: string;
  secondary?: string; // titre, badges, éditeur de code
  background?: string; // fond principal
  backgroundAlt?: string; // grande forme diagonale
};

const slideDesigns: Record<string, SlideDesign> = {
  "ranger-telechargements": { image: "/images/dossier.png" },
  "photos-vers-word": { image: "/images/fusion.png", imagePosition: "left" },
};

/* ════════════════════════════════════════════════════════════════════
   3. ICÔNES (traits propres, style Lucide)
   ════════════════════════════════════════════════════════════════════ */

const icons = {
  search: "M11 4a7 7 0 100 14 7 7 0 000-14z|M20 20l-4-4",
  x: "M18 6L6 18|M6 6l12 12",
  terminal: "M4 17l6-6-6-6|M12 19h8",
  code: "M16 18l6-6-6-6|M8 6l-6 6 6 6",
  file: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8",
  monitor: "M4 3h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2z|M8 21h8|M12 17v4",
  wrench:
    "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94z",
  checkCircle: "M22 11.08V12a10 10 0 11-5.93-9.14|M22 4L12 14.01l-3-3",
  copy: "M10 8h10a2 2 0 012 2v10a2 2 0 01-2 2H10a2 2 0 01-2-2V10a2 2 0 012-2z|M4 16a2 2 0 01-2-2V4a2 2 0 012-2h10a2 2 0 012 2",
  check: "M20 6L9 17l-5-5",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z|M8.5 12l2.5 2.5L16 9.5",
  layers: "M12 2L2 7l10 5 10-5-10-5z|M2 17l10 5 10-5|M2 12l10 5 10-5",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4|M16 17l5-5-5-5|M21 12H9",
  sparkles: "M12 3l1.9 5.8L20 10.7l-6.1 1.9L12 18.4l-1.9-5.8L4 10.7l6.1-1.9L12 3z|M19 3v4|M17 5h4|M5 17v4|M3 19h4",
};

function Ico({
  d,
  className = "h-4 w-4",
  sw = 1.8,
}: {
  d: string;
  className?: string;
  sw?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d.split("|").map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}

// Logo Windows (4 carreaux)
function WindowsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M3 5.6l7.4-1v7.1H3zM11.5 4.4L21 3v8.7h-9.5zM3 12.5h7.4v7.1L3 18.4zM11.5 12.5H21V21l-9.5-1.4z" />
    </svg>
  );
}

// Icône selon le type de fichier
function fileIcon(type: string) {
  const t = type.toLowerCase();
  if (["bat", "cmd", "sh", "ps1"].includes(t)) return icons.terminal;
  if (["py", "js", "ts"].includes(t)) return icons.code;
  return icons.file;
}

// Icône selon la plateforme
function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  return /windows/i.test(platform) ? (
    <WindowsIcon className={className} />
  ) : (
    <Ico d={icons.monitor} className={className} />
  );
}

const noRequirement = (r: string) => /^(aucun|none|rien)/i.test(r.trim());

const toneClass = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};
type Tone = keyof typeof toneClass;

// Petite puce : icône colorée + texte
function Chip({
  icon,
  tone,
  children,
}: {
  icon: React.ReactNode;
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-sm border border-border-strong bg-surface py-1 pl-1 pr-3 text-xs font-medium sm:text-sm">
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-sm ${toneClass[tone]}`}>
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════
   4. ANIMATIONS
   ════════════════════════════════════════════════════════════════════ */

// Apparition progressive : floue + décalée vers le bas à gauche → nette à sa place.
// "delay" crée l'effet cascade.
function rise(on: boolean, delay = 0): React.CSSProperties {
  return on
    ? {
        opacity: 1,
        transform: "translate3d(0, 0, 0)",
        filter: "blur(0px)",
        transition: `opacity 1s ease ${delay}ms, transform 1.2s ${EASE} ${delay}ms, filter 1s ease ${delay}ms`,
      }
    : {
        opacity: 0,
        transform: "translate3d(var(--rx, -40px), var(--ry, 60px), 0)",
        filter: "blur(10px)",
        transition: "opacity 0.25s ease, transform 0.4s ease, filter 0.25s ease",
      };
}

// Titre : chaque mot monte dans un masque, l'un après l'autre
function Words({
  text,
  on,
  start = 0,
  step = 100,
}: {
  text: string;
  on: boolean;
  start?: number;
  step?: number;
}) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="inline-block overflow-hidden py-[0.06em] align-bottom">
            <span
              className="inline-block will-change-transform"
              style={{
                transform: on ? "translate3d(0,0,0)" : "translate3d(0,115%,0)",
                transition: on
                  ? `transform 1.1s ${EASE} ${start + i * step}ms`
                  : "transform 0.3s ease",
              }}
            >
              {w}
            </span>
          </span>
        </Fragment>
      ))}
    </>
  );
}

// Forme décorative qui « pop » puis flotte doucement
function Pop({
  on,
  delay,
  className = "",
  dur = 8,
  children,
}: {
  on: boolean;
  delay: number;
  className?: string;
  dur?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute ${className}`}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "scale(1)" : "scale(0.4)",
        transition: on
          ? `opacity 1s ease ${delay}ms, transform 1.5s ${EASE} ${delay}ms`
          : "none",
      }}
    >
      <div
        className="ah-float"
        style={{ animationDuration: `${dur}s`, animationDelay: `${delay}ms` }}
      >
        {children}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   5. GROUPES : un slide = une tâche, avec ses niveaux
   ────────────────────────────────────────────────────────────────────
   Les automatisations qui ont EXACTEMENT LE MÊME TITRE sont regroupées
   dans un seul slide. Si une tâche existe en Débutant / Intermédiaire /
   Avancé, il suffit de créer 3 automatisations avec le même titre et un
   niveau différent : le slide affiche alors un sélecteur de niveau.
   ════════════════════════════════════════════════════════════════════ */

type Group = { key: string; variants: Automation[] };

const rank = (level: string) => {
  const i = LEVEL_ORDER.indexOf(level);
  return i === -1 ? 99 : i;
};

function buildGroups(list: Automation[]): Group[] {
  const map = new Map<string, Group>();
  for (const a of list) {
    const key = a.title.trim().toLowerCase();
    const g = map.get(key);
    if (g) g.variants.push(a);
    else map.set(key, { key, variants: [a] });
  }
  const groups = [...map.values()];
  groups.forEach((g) => g.variants.sort((x, y) => rank(x.level) - rank(y.level)));
  return groups;
}

/* ════════════════════════════════════════════════════════════════════
   5b. BLOC DE BIENVENUE
   ────────────────────────────────────────────────────────────────────
   Mobile : au-dessus de l'image.
   Desktop : flotte en haut à droite, par-dessus l'image.
   ════════════════════════════════════════════════════════════════════ */

type Welcome = { greeting: string; name: string; message: string };

function WelcomeBanner({ w, c, left }: { w: Welcome; c: boolean; left: boolean }) {
  return (
    <div
      style={rise(c, 350)}
      className={`mb-2 flex items-center gap-3 rounded-sm border border-border-strong bg-surface/80 px-3 py-2 backdrop-blur sm:mb-3 sm:py-2.5 lg:absolute lg:bottom-6 lg:z-20 lg:mb-0 lg:w-[360px] ${
      left ? "lg:left-16" : "lg:right-16"
      }`}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-sm text-secondary sm:h-10 sm:w-10"
        style={{ background: AMBER }}
      >
        <Ico d={icons.sparkles} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold sm:text-base">
          {w.greeting}, <span className="text-primary">{w.name}</span>
        </p>
        {/* key = la phrase : quand elle change, elle réapparaît en douceur */}
        <p
          key={w.message}
          className="ah-fade line-clamp-2 text-xs leading-snug text-foreground-secondary sm:text-[13px]"
        >
          {w.message}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   6. VISUEL DU SLIDE (image, code ou fiche technique)
   ────────────────────────────────────────────────────────────────────
   Pas de cadre, pas d'ombre, pas de bordure, pas d'arrondi : le visuel
   est fondu dans la page (classe .ah-blend = bords en dégradé).
   Desktop : il occupe tout le côté, de haut en bas, jusqu'au bord.
   ════════════════════════════════════════════════════════════════════ */

function SlideVisual({
  a,
  design,
  index,
  anim,
  c,
  isAdmin,
  left,
}: {
  a: Automation;
  design: SlideDesign;
  index: number;
  anim: number; // numéro de l'animation en cours
  c: boolean; // contenu visible ?
  isAdmin: boolean;
  left: boolean; // visuel à gauche sur desktop ?
}) {
  const visual = design.visual ?? "image";
  const image = design.image ?? HERO_IMAGE;
  const fit = design.imageFit === "contain" ? "object-contain" : "object-cover";
  const codeLines = (a.code ?? "# Aucun code disponible").split("\n").slice(0, 14);

  // Animation d'entrée choisie selon la position du slide (1→5 puis on recommence)
  const reveal = REVEALS[anim % REVEALS.length];
  const specs: { label: string; value: string; icon: React.ReactNode; tone: Tone }[] = [
    {
      label: "Niveau",
      value: a.level,
      icon: <Ico d={icons.layers} className="h-5 w-5" />,
      tone: "primary",
    },
    {
      label: "Type de fichier",
      value: `.${a.fileType}`,
      icon: <Ico d={fileIcon(a.fileType)} className="h-5 w-5" />,
      tone: "info",
    },
    {
      label: "Plateforme",
      value: a.platform,
      icon: <PlatformIcon platform={a.platform} className="h-5 w-5" />,
      tone: "warning",
    },
    {
      label: "Prérequis",
      value: a.requirements,
      icon: (
        <Ico
          d={noRequirement(a.requirements) ? icons.checkCircle : icons.wrench}
          className="h-5 w-5"
        />
      ),
      tone: noRequirement(a.requirements) ? "success" : "warning",
    },
  ];

  return (
    <div
      className={`relative h-[26dvh] w-full sm:h-[32dvh] lg:absolute lg:inset-y-0 lg:z-10 lg:h-auto lg:w-[58%] ${
        left ? "lg:left-0" : "lg:right-0"
      }`}
    >
      {/* Zone qui s'ouvre (animation d'entrée) : aucun cadre visible */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          clipPath: c ? reveal.shown : reveal.hidden,
          transition: c ? `clip-path 1.6s ${EASE} 600ms` : "clip-path 0.35s ease",
        }}
      >
        {/* Contenu fondu dans la page (dégradé sur les bords) */}
        <div className={`ah-blend absolute inset-0 ${left ? "ah-blend-left" : ""}`}>
          {/* ── Variante IMAGE ── */}
          {visual === "image" && (
            <Image
              src={image}
              alt={a.title}
              fill
              priority={index === 0}
              unoptimized
              sizes="(min-width: 1024px) 58vw, 100vw"
              className={`${fit} object-center`}
              style={{
                transform: c ? "scale(1) translate3d(0,0,0)" : reveal.zoom,
                transition: `transform 2.6s ${EASE} 600ms`,
              }}
            />
          )}

          {/* ── Variante CODE : mini éditeur ── */}
          {visual === "code" && (
            <div className="flex h-full flex-col bg-secondary text-on-secondary lg:pl-[26%] lg:pt-24">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                <span className="ml-2 truncate font-mono text-xs text-white/60">
                  {a.slug}.{a.fileType}
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden p-4 font-mono text-[11px] leading-5 sm:text-xs lg:text-sm lg:leading-6">
                {codeLines.map((line, i) => (
                  <div
                    key={i}
                    className="flex gap-3"
                    style={{
                      opacity: c ? 1 : 0,
                      transform: c ? "none" : "translateX(-12px)",
                      transition: c
                        ? `opacity 0.6s ease ${1100 + i * 80}ms, transform 0.8s ${EASE} ${1100 + i * 80}ms`
                        : "none",
                    }}
                  >
                    <span className="w-5 shrink-0 select-none text-right text-white/30">
                      {i + 1}
                    </span>
                    <span className="whitespace-pre">{line || " "}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Variante FICHE TECHNIQUE (texte) ── */}
          {visual === "specs" && (
            <div className="flex h-full flex-col justify-center gap-2 p-4 sm:gap-3 sm:p-6 lg:pl-[26%] lg:pr-24 lg:pt-20">
              <p
                style={rise(c, 1000)}
                className="font-heading text-xs uppercase tracking-[0.18em] text-primary sm:text-sm"
              >
                Fiche technique
              </p>
              {specs.map((s, i) => (
                <div
                  key={s.label}
                  style={rise(c, 1100 + i * 130)}
                  className="flex items-center gap-3 rounded-sm border border-border bg-surface/80 px-3 py-2 sm:py-3"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-sm sm:h-10 sm:w-10 ${toneClass[s.tone]}`}
                  >
                    {s.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] uppercase tracking-wide text-foreground-muted">
                      {s.label}
                    </span>
                    <span className="block truncate text-sm font-semibold sm:text-base">
                      {s.value}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* [B1] Badge du niveau (image uniquement) */}
      {visual === "image" && (
        <span
          style={rise(c, 1500)}
          className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-sm bg-secondary px-2.5 py-1 text-xs font-semibold text-on-secondary sm:right-4 sm:top-4 lg:top-24 ${
            left ? "lg:left-16 lg:right-auto" : "lg:right-16"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${levelDot[a.level] ?? "bg-foreground-muted"}`} />
          {a.level}
        </span>
      )}

      {/* [B3] Numéro (image uniquement) */}
      {visual === "image" && (
        <span
          style={rise(c, 1650)}
          className={`absolute bottom-3 left-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-primary font-heading text-base text-on-primary sm:bottom-4 sm:left-4 sm:h-14 sm:w-14 sm:text-lg lg:bottom-10 ${
            left ? "lg:left-auto lg:right-[22%]" : "lg:left-[22%]"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      )}

      {/* [B2] Boutons admin */}
      {isAdmin && (
        <div
          className={`absolute bottom-3 right-3 z-20 flex items-center gap-0.5 rounded-sm bg-surface/95 p-1 backdrop-blur sm:bottom-4 sm:right-4 lg:bottom-28 ${
            left ? "lg:left-16 lg:right-auto" : "lg:right-16"
          }`}
        >
          <Link
            href={`/admin/edit/${a.slug}`}
            className="inline-flex items-center rounded-sm px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-background-alt"
          >
            Modifier
          </Link>
          <div className="[&_button]:rounded-sm! [&_button]:border-0! [&_button]:bg-transparent! [&_button]:px-2.5! [&_button]:py-1.5! [&_button]:text-xs! [&_button]:font-semibold! [&_button]:text-error! [&_button]:hover:bg-error/10!">
            <DeleteButton slug={a.slug} title={a.title} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   7. UN SLIDE = UNE TÂCHE (≈ 90vh, sans défilement)
   ────────────────────────────────────────────────────────────────────
   Blocs : [A] fond + formes · [B] visuel · [W] bienvenue · [C] petit
   titre · [D] titre · [E] sous-titre + niveau · [F] description
   [G] infos fichier · [H] boutons
   ════════════════════════════════════════════════════════════════════ */

function AutomationSlide({
  group,
  index,
  total,
  anim,
  state,
  on,
  isAdmin,
  welcome,
  initialSlug,
  onOpenDetail,
  onVariant,
}: {
  group: Group;
  index: number;
  total: number;
  anim: number; // numéro de l'animation en cours
  state: "active" | "leaving" | "idle";
  on: boolean;
  isAdmin: boolean;
  welcome: Welcome | null;
  initialSlug?: string;
  onOpenDetail: (slug: string) => void;
  onVariant: (slug: string) => void;
}) {
  // Niveau affiché dans ce slide
  const [variantIdx, setVariantIdx] = useState(() => {
    const i = group.variants.findIndex((v) => v.slug === initialSlug);
    return i >= 0 ? i : 0;
  });
  const a = group.variants[Math.min(variantIdx, group.variants.length - 1)];

  // entered : le fond est ouvert · c : le contenu est visible
  const [entered, setEntered] = useState(false);
  const [c, setC] = useState(false);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Déclenche l'animation d'entrée (double rAF = le navigateur voit l'état de départ)
  useEffect(() => {
    if (!on) {
      setEntered(false);
      setC(false);
      return;
    }
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        setEntered(true);
        setC(true);
      });
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [on]);

  useEffect(() => () => clearTimeout(swapTimer.current), []);

  // Prévient l'accueil du niveau affiché (pour l'adresse /?a=slug)
  useEffect(() => {
    if (on) onVariant(a.slug);
  }, [on, a.slug, onVariant]);

  // Changer de niveau : le contenu sort puis revient progressivement
  const changeVariant = (i: number) => {
    if (i === variantIdx) return;
    setC(false);
    clearTimeout(swapTimer.current);
    swapTimer.current = setTimeout(() => {
      setVariantIdx(i);
      requestAnimationFrame(() => requestAnimationFrame(() => setC(true)));
    }, 320);
  };

  const design = slideDesigns[a.slug] ?? {};
  const visualLeft = design.imagePosition === "left";

  // Les couleurs personnalisées écrasent le thème pour ce slide seulement
  const cssVars: Record<string, string> = {};
  if (design.primary) cssVars["--color-primary"] = design.primary;
  if (design.primaryDark) cssVars["--color-primary-dark"] = design.primaryDark;
  if (design.secondary) cssVars["--color-secondary"] = design.secondary;
  if (design.background) cssVars["--color-background"] = design.background;
  if (design.backgroundAlt) cssVars["--color-background-alt"] = design.backgroundAlt;

  // Animation de la page et du texte selon le numéro en cours
  const pageAnim = PAGE_TRANSITIONS[anim % PAGE_TRANSITIONS.length];
  const textFrom = TEXT_FROM[anim % TEXT_FROM.length];
  cssVars["--rx"] = textFrom.x;
  cssVars["--ry"] = textFrom.y;
  const z = state === "active" ? "z-20" : state === "leaving" ? "z-10" : "z-0";
  const open = entered || state === "leaving";

  return (
    <section
      aria-hidden={!on}
      style={cssVars as React.CSSProperties}
      className={`absolute inset-0 ${z} ${on ? "" : "pointer-events-none"}`}
    >
      {/* ─── [A] FOND : s'ouvre en cercle depuis le coin en bas à gauche ─── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden bg-background"
        style={{
          clipPath: open ? pageAnim.shown : pageAnim.hidden,
          transition: entered ? `clip-path 1.5s ${EASE}` : "none",
        }}
      >
        {/* Grande forme diagonale pêche */}
        <div
          className={`absolute inset-y-0 w-full -skew-x-12 bg-background-alt lg:w-3/5 lg:translate-x-0 ${
            visualLeft ? "left-0 -translate-x-1/4" : "right-0 translate-x-1/4"
          }`}
        />

        {/* ─── [A2] FORMES DÉCORATIVES (apparaissent une à une, flottent) ─── */}
        <Pop on={entered} delay={500} dur={9} className="-left-20 -top-20">
          <div className="h-72 w-72 rounded-full border-[26px] border-primary/10" />
        </Pop>
        <Pop on={entered} delay={800} dur={11} className="-bottom-16 right-[6%]">
          <div
            className="h-56 w-56 rounded-[42%_58%_60%_40%/50%_40%_60%_50%]"
            style={{ background: `${AMBER}55` }}
          />
        </Pop>
        <Pop on={entered} delay={1000} dur={7} className="right-[5%] top-[16%] hidden sm:block">
          <div
            className="h-24 w-24 opacity-30"
            style={{
              backgroundImage: "radial-gradient(var(--color-secondary) 2px, transparent 2px)",
              backgroundSize: "14px 14px",
            }}
          />
        </Pop>
        <Pop on={entered} delay={1200} dur={10} className="bottom-[9%] left-[3%] hidden sm:block">
          <svg width="170" height="32" viewBox="0 0 170 32" fill="none" aria-hidden="true">
            <path
              d="M2 16Q20 0 38 16T74 16T110 16T146 16T168 16"
              stroke="var(--color-primary)"
              strokeOpacity="0.45"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </Pop>
        <Pop on={entered} delay={1400} dur={8} className="left-[47%] top-[11%] hidden lg:block">
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
            <path
              d="M14 3v22M3 14h22"
              stroke="var(--color-secondary)"
              strokeOpacity="0.35"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </Pop>
        <Pop on={entered} delay={1600} dur={12} className="bottom-[7%] left-[42%] hidden lg:block">
          <svg width="46" height="42" viewBox="0 0 46 42" fill="none" aria-hidden="true">
            <path
              d="M23 4L43 38H3z"
              stroke="var(--color-info)"
              strokeOpacity="0.4"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        </Pop>
      </div>

      {/* Zone de contenu : 90 % de la hauteur, en bas (le header prend les 10 % du haut).
          Sur desktop ces conteneurs sont "static" pour que le visuel se positionne
          par rapport à tout l'écran (jusqu'au bord). */}
      <div className="relative mx-auto flex h-dvh max-w-7xl items-end px-4 sm:px-8 lg:static lg:px-12">
        <div className="flex h-[90dvh] w-full items-center pb-3 pr-7 sm:pr-12 lg:static lg:pr-16">
          <div className="grid w-full items-center gap-3 sm:gap-5 lg:grid-cols-1">
            {/* ─── [W] BIENVENUE + [B] VISUEL (sur desktop : sortis du flux, sur le côté) ─── */}
            <div className="order-1 lg:contents">
              {welcome && <WelcomeBanner w={welcome} c={c} left={visualLeft} />}
              <SlideVisual
                a={a}
                design={design}
                index={index}
                anim={anim}
                c={c}
                isAdmin={isAdmin}
                left={visualLeft}
              />
            </div>

            {/* ─── COLONNE TEXTE ─── */}
            <div
              className={`relative z-10 order-2 min-w-0 lg:max-w-[44%] ${
                visualLeft ? "lg:ml-auto" : ""
              }`}
            >
              {/* [C] Petit titre : trait + catégorie + position */}
              <div style={rise(c, 450)} className="flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <p className="font-heading text-xs uppercase tracking-[0.18em] text-primary sm:text-sm">
                  {a.category ?? "Automatisation"} · {index + 1}/{total}
                </p>
              </div>

              {/* [D] Titre (en bleu nuit pour limiter l'orange, chaque mot monte) */}
              <h1 className="mt-2 break-words text-3xl text-secondary sm:mt-3 sm:text-4xl lg:text-5xl xl:text-6xl">
                <Words text={a.title} on={c} start={650} />
              </h1>

              {/* [E] Sous-titre + niveau (sélecteur si la tâche a plusieurs niveaux) */}
              {a.subtitle && (
                <p
                  style={rise(c, 1050)}
                  className="mt-2 line-clamp-1 font-heading text-sm uppercase tracking-wide text-foreground-secondary sm:text-lg"
                >
                  {a.subtitle}
                </p>
              )}
              <div style={rise(c, 1150)} className="mt-3 flex max-w-full">
                {group.variants.length > 1 ? (
                  <div
                    role="tablist"
                    aria-label="Niveau"
                    className="inline-flex max-w-full overflow-x-auto rounded-sm border border-border-strong bg-surface p-0.5"
                  >
                    {group.variants.map((v, i) => (
                      <button
                        key={v.id}
                        role="tab"
                        aria-selected={i === variantIdx}
                        onClick={() => changeVariant(i)}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-semibold transition sm:px-3 sm:text-sm ${
                          i === variantIdx
                            ? "bg-secondary text-on-secondary"
                            : "text-foreground-secondary hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${levelDot[v.level] ?? "bg-foreground-muted"}`}
                        />
                        {v.level}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-secondary px-2.5 py-1 text-xs font-semibold text-on-secondary sm:text-sm">
                    <span
                      className={`h-2 w-2 rounded-full ${levelDot[a.level] ?? "bg-foreground-muted"}`}
                    />
                    {a.level}
                  </span>
                )}
              </div>

              {/* [F] Description courte (la version complète est dans « Détails & code ») */}
              <p
                style={rise(c, 1250)}
                className="mt-3 line-clamp-2 max-w-lg text-sm leading-relaxed text-foreground-secondary sm:line-clamp-3 sm:text-[15px]"
              >
                {a.description}
              </p>

              {/* [G] Infos du fichier avec de vraies icônes */}
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                <div style={rise(c, 1350)}>
                  <Chip
                    tone="primary"
                    icon={<Ico d={fileIcon(a.fileType)} className="h-3.5 w-3.5" />}
                  >
                    .{a.fileType}
                  </Chip>
                </div>
                <div style={rise(c, 1430)}>
                  <Chip
                    tone="info"
                    icon={<PlatformIcon platform={a.platform} className="h-3.5 w-3.5" />}
                  >
                    {a.platform}
                  </Chip>
                </div>
                <div style={rise(c, 1510)} className="max-w-full">
                  <Chip
                    tone={noRequirement(a.requirements) ? "success" : "warning"}
                    icon={
                      <Ico
                        d={noRequirement(a.requirements) ? icons.checkCircle : icons.wrench}
                        className="h-3.5 w-3.5"
                      />
                    }
                  >
                    {noRequirement(a.requirements) ? "Aucun prérequis" : a.requirements}
                  </Chip>
                </div>
              </div>

              {/* Message pour les visiteurs sur téléphone */}
              <p
                style={rise(c, 1560)}
                className="mt-3 flex items-start gap-2 rounded-sm border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-foreground md:hidden"
              >
                <Ico d={icons.monitor} className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                Cette automatisation se lance sur un PC : ouvre cette page depuis
                ton ordinateur pour la télécharger.
              </p>

              {/* [H] Boutons : téléchargement + détails (radius sm, pas étirés) */}
              <div
                style={rise(c, 1650)}
                className="mt-3 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3"
              >
                <div className="[&_a]:rounded-sm! [&_button]:w-auto! [&_button]:rounded-sm! [&_button]:px-4! [&_button]:py-2.5! [&_button]:text-sm!">
                  <DownloadButton slug={a.slug} fileType={a.fileType} />
                </div>
                <button
                  onClick={() => onOpenDetail(a.slug)}
                  className="inline-flex items-center gap-2 rounded-sm border border-secondary px-4 py-2.5 text-sm font-semibold text-secondary transition hover:bg-secondary hover:text-on-secondary"
                >
                  <Ico d={icons.code} />
                  Détails &amp; code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ════════════════════════════════════════════════════════════════════
   7b. AVIS : note moyenne, liste, formulaire
   ════════════════════════════════════════════════════════════════════ */

type ReviewItem = {
  id: number;
  userName: string;
  image?: string | null; // photo de profil Google
  rating: number;
  comment: string;
  createdAt: string;
};

const STAR_PATH = "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z";

// Étoiles en lecture seule
function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          className={`${className} ${n <= Math.round(value) ? "text-[#F5B544]" : "text-border-strong"}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}
const TORN =
  "polygon(0 0, 100% 0, 100% 93%, 96% 97%, 92% 93%, 87% 98%, 82% 94%, 77% 99%, 71% 94%, 66% 98%, 60% 93%, 55% 98%, 49% 94%, 43% 99%, 38% 94%, 32% 98%, 27% 93%, 21% 98%, 15% 94%, 9% 99%, 4% 94%, 0 97%)";

const TILTS = [-1.4, 1, -0.6, 1.5, -1];

function Avatar({
  name,
  src,
  className = "h-12 w-12",
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`${className} grid place-items-center rounded-full bg-secondary font-heading text-on-secondary`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
function ReviewsSection({
  slug,
  userName,
  isAdmin,
  visible,
}: {
  slug: string;
  userName: string | null;
  isAdmin: boolean;
  visible: boolean;
}) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [focused, setFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?slug=${encodeURIComponent(slug)}`);
      const data = (await res.json()) as { reviews?: ReviewItem[] };
      setReviews(data.reviews ?? []);
    } catch {}
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const submit = async () => {
    if (sending) return;
    if (rating < 1) {
      setError("Choisis une note de 1 à 5.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, rating, comment }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
      } else {
        setComment("");
        setRating(0);
        await load();
      }
    } catch {
      setError("Erreur réseau, réessaie.");
    }
    setSending(false);
  };

  const remove = async (id: number) => {
    try {
      await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      await load();
    } catch {}
  };

  const open = focused || comment.length > 0;

  return (
    <div style={rise(visible, 700)} className="min-w-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-heading text-xs uppercase tracking-[0.18em] text-primary sm:text-sm">
          Avis ({reviews.length})
        </p>
        {reviews.length > 0 && (
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <Stars value={average} />
            {average.toFixed(1)}/5
          </span>
        )}
      </div>

      {userName ? (
        <div className="mb-5">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                  className="p-0.5"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-5 w-5 transition ${
                      n <= rating ? "text-[#F5B544]" : "text-border-strong hover:text-[#F5B544]/60"
                    }`}
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d={STAR_PATH} />
                  </svg>
                </button>
              ))}
            </div>
            <span
              className="text-[11px] text-foreground-muted transition-opacity"
              style={{ opacity: open ? 1 : 0 }}
            >
              {comment.length}/500
            </span>
          </div>

          <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={500}
              rows={1}
              placeholder="Écris ton avis…"
              className="field-sizing-content block max-h-32 min-h-9 w-full resize-none bg-transparent pb-2 pr-12 pt-1 text-sm text-foreground outline-none placeholder:text-foreground-muted"
            />
            <span className="absolute inset-x-0 bottom-0 h-px bg-border-strong" />
            <span
              className="absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 bg-primary"
              style={{
                width: focused ? "100%" : "0%",
                transition: `width 0.8s ${EASE}`,
              }}
            />
            <button
              onClick={submit}
              disabled={sending}
              aria-label="Publier mon avis"
              title="Publier mon avis"
              className="absolute bottom-2 right-0 grid h-8 w-8 place-items-center rounded-full bg-secondary text-on-secondary transition hover:opacity-90 disabled:opacity-50"
            >
              <Ico d="M22 2L11 13|M22 2l-7 20-4-9-9-4z" className="h-4 w-4" />
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-error">{error}</p>}
        </div>
      ) : (
        <p className="mb-5 text-sm text-foreground-secondary">
          Connecte-toi avec Google pour laisser un avis.
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-foreground-secondary">
          Aucun avis pour l&apos;instant. Sois le premier !
        </p>
      ) : (
        <ul className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {reviews.map((r, i) => (
            <li
              key={r.id}
              className="relative w-[250px] shrink-0 snap-start pt-6"
              style={{
                transform: `rotate(${TILTS[i % TILTS.length]}deg)`,
                filter: "drop-shadow(0 8px 10px rgba(30,41,80,0.14))",
              }}
            >
              <span className="absolute left-5 top-0 z-10 rounded-full ring-4 ring-white">
                <Avatar name={r.userName} src={r.image} className="h-12 w-12" />
              </span>

              <div className="bg-white/85 px-4 pb-8 pt-9" style={{ clipPath: TORN }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-secondary">
                    {r.userName}
                  </span>
                  <Stars value={r.rating} className="h-3.5 w-3.5" />
                </div>
                <p className="mt-2 line-clamp-4 break-words text-sm leading-snug text-foreground-secondary">
                  {r.comment || "—"}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-foreground-muted">
                    {r.createdAt.slice(0, 10)}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => remove(r.id)}
                      className="text-xs font-semibold text-error hover:underline"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


/* ════════════════════════════════════════════════════════════════════
   8. PANNEAU « DÉTAILS & CODE »
   ────────────────────────────────────────────────────────────────────
   Un tiroir qui glisse depuis la droite (depuis le bas sur mobile),
   fond flouté, bandeau bleu nuit avec formes, ligne qui se dessine,
   puis chaque bloc apparaît en cascade. Le code est dans un éditeur
   avec numéros de ligne et bouton « Copier ».
   ════════════════════════════════════════════════════════════════════ */
function DetailPanel({
  a,
  visible,
  onClose,
  userName,
  isAdmin,
}: {
  a: Automation;
  visible: boolean;
  onClose: () => void;
  userName: string | null;
  isAdmin: boolean;
}) {
  const [view, setView] = useState<"info" | "reviews" | "code">("info");
  const [copied, setCopied] = useState(false);
  const lines = (a.code ?? "Aucun code disponible.").split("\n");
  const noReq = noRequirement(a.requirements);
  const isCode = view === "code";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(a.code ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const specs: { label: string; value: string; icon: React.ReactNode; tone: Tone }[] = [
    {
      label: "Fichier",
      value: `.${a.fileType}`,
      icon: <Ico d={fileIcon(a.fileType)} className="h-4 w-4" />,
      tone: "primary",
    },
    {
      label: "Plateforme",
      value: a.platform,
      icon: <PlatformIcon platform={a.platform} className="h-4 w-4" />,
      tone: "info",
    },
    {
      label: "Prérequis",
      value: a.requirements,
      icon: <Ico d={noReq ? icons.checkCircle : icons.wrench} className="h-4 w-4" />,
      tone: noReq ? "success" : "warning",
    },
  ];
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      {/* Verre dépoli sur toute la page */}
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-gradient-to-br from-background/70 via-background/55 to-secondary/30 backdrop-blur-2xl backdrop-saturate-150"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.7s ease" }}
      />

      {/* Contenu posé sur le verre : mêmes marges que le header et les slides */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 sm:px-8 lg:px-12">
        <div
          className={`pointer-events-auto relative flex w-full max-w-7xl flex-col ${
            isCode ? "h-[84dvh]" : "max-h-[84dvh]"
          }`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translate3d(0,0,0)" : "translate3d(0,24px,0)",
            filter: visible ? "blur(0px)" : "blur(8px)",
            transition: `opacity 0.7s ease, transform 1s ${EASE}, filter 0.7s ease`,
          }}
        >
          {/* ─── En-tête ─── */}
          <div className="flex shrink-0 items-start justify-between gap-4 pb-4">
            <div className="min-w-0">
              <p className="font-heading text-xs uppercase tracking-[0.18em] text-primary sm:text-sm">
                {isCode ? "Code source" : "Détails de l'automatisation"}
              </p>
              <h2 className="mt-1 break-words text-2xl text-secondary sm:text-4xl">{a.title}</h2>
              <span
                style={{ background: AMBER }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold text-secondary"
              >
                <span className={`h-2 w-2 rounded-full ${levelDot[a.level] ?? "bg-foreground-muted"}`} />
                {a.level}
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-white/30 text-secondary backdrop-blur-md transition hover:bg-secondary hover:text-on-secondary"
            >
              <Ico d={icons.x} />
            </button>
          </div>

          {/* ─── Vue CODE : fondue dans la page ─── */}
          {isCode ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setView("info")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary"
                >
                  <span className="rotate-180">
                    <Ico d="M5 12h14|M13 6l6 6-6 6" />
                  </span>
                  Retour aux détails
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copy}
                    className="inline-flex items-center gap-1.5 rounded-sm bg-white/30 px-3 py-2 text-sm font-semibold text-secondary backdrop-blur-md transition hover:bg-secondary hover:text-on-secondary"
                  >
                    <Ico d={copied ? icons.check : icons.copy} className="h-4 w-4" />
                    {copied ? "Copié" : "Copier"}
                  </button>
                  <div className="[&_a]:rounded-sm! [&_button]:w-auto! [&_button]:rounded-sm! [&_button]:px-4! [&_button]:py-2! [&_button]:text-sm!">
                    <DownloadButton slug={a.slug} fileType={a.fileType} />
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto rounded-sm bg-secondary/85 p-4 font-mono text-xs leading-5 text-on-secondary backdrop-blur-md sm:text-[13px] sm:leading-6">
                {lines.map((line, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="w-8 shrink-0 select-none text-right text-white/30">{i + 1}</span>
                    <span className="whitespace-pre">{line || " "}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Sélecteur Détails / Avis : mobile seulement */}
              <div className="mb-3 inline-flex self-start rounded-sm bg-white/30 p-0.5 backdrop-blur-md lg:hidden">
                {(["info", "reviews"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-sm px-4 py-1.5 text-sm font-semibold transition ${
                      view === v ? "bg-secondary text-on-secondary" : "text-foreground-secondary"
                    }`}
                  >
                    {v === "info" ? "Détails" : "Avis"}
                  </button>
                ))}
              </div>

              {/* ─── Contenu : 2 colonnes sur grand écran, sans défilement ─── */}
              <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto pb-2 lg:grid-cols-2 lg:gap-16 lg:overflow-hidden">
                {/* Colonne gauche */}
                <div className={`${view === "reviews" ? "hidden" : "block"} min-w-0 lg:block`}>
                  <p
                    style={rise(visible, 400)}
                    className="whitespace-pre-line text-sm leading-relaxed text-foreground-secondary sm:text-[15px]"
                  >
                    {a.description}
                  </p>

                  <div style={rise(visible, 500)} className="mt-4 flex flex-wrap gap-2">
                    {specs.map((s) => (
                      <Chip key={s.label} tone={s.tone} icon={s.icon}>
                        {s.value}
                      </Chip>
                    ))}
                  </div>

                  <div style={rise(visible, 600)} className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                    <div className="[&_a]:rounded-sm! [&_button]:w-auto! [&_button]:rounded-sm! [&_button]:px-4! [&_button]:py-2.5! [&_button]:text-sm!">
                      <DownloadButton slug={a.slug} fileType={a.fileType} />
                    </div>
                    <button
                      onClick={() => setView("code")}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-secondary underline-offset-4 transition hover:text-primary hover:underline"
                    >
                      <Ico d={icons.code} />
                      Voir le code
                    </button>
                  </div>

                  <p
                    style={rise(visible, 700)}
                    className="mt-4 flex items-center gap-2 text-sm text-foreground-secondary"
                  >
                    <Ico d={icons.shield} className="h-4 w-4 shrink-0 text-success" />
                    Lis exactement ce que fait ce fichier avant de le lancer.
                  </p>
                </div>

                {/* Colonne droite : avis */}
                <div className={`${view === "info" ? "hidden" : "block"} min-w-0 lg:block`}>
                  <ReviewsSection
                    key={a.slug}
                    slug={a.slug}
                    userName={userName}
                    isAdmin={isAdmin}
                    visible={visible}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   9. PAGE D'ACCUEIL : header, recherche, gouttes, slides, panneau
   ════════════════════════════════════════════════════════════════════ */

export default function HomeClient({
  automations,
  isAdmin,
  initialSlug,
  userName,
}: {
  automations: Automation[];
  isAdmin: boolean;
  initialSlug?: string;
  userName: string | null; // null = visiteur non connecté
}) {
  const groups = useMemo(() => buildGroups(automations), [automations]);

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [animKey, setAnimKey] = useState(0); // relance l'animation à chaque recherche
  const [signingOut, setSigningOut] = useState(false);

  // Bienvenue : salutation selon l'heure + message qui change
  const [greeting, setGreeting] = useState("Bonjour");
  const [msgIdx, setMsgIdx] = useState(0);

  const [active, setActive] = useState(() => {
    const i = groups.findIndex((g) => g.variants.some((v) => v.slug === initialSlug));
    return i >= 0 ? i : 0;
  });
    const [prev, setPrev] = useState<number | null>(null);
  const [navCount, setNavCount] = useState(0); // +1 à chaque changement → animation suivante

  const inputRef = useRef<HTMLInputElement>(null);
  const wheelLock = useRef(false);
  const touchY = useRef<number | null>(null);

  // Recherche : par titre ou catégorie
  const q = search.trim().toLowerCase();
  const filtered = groups.filter(
    (g) =>
      q === "" ||
      g.variants.some(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.category ?? "").toLowerCase().includes(q)
      )
  );
  const total = filtered.length;
  const detail = automations.find((a) => a.slug === detailSlug) ?? null;

  // Bloc de bienvenue (null si non connecté)
  const welcome: Welcome | null = userName
    ? {
        greeting,
        name: userName.trim().split(" ")[0],
        message: WELCOME_MESSAGES[msgIdx % WELCOME_MESSAGES.length],
      }
    : null;

  const goTo = useCallback(
    (i: number) => {
      if (total === 0) return;
      const target = ((i % total) + total) % total;
      if (target === active) return;
      setPrev(active);
      setActive(target);
      setNavCount((n) => n + 1);
    },
    [active, total]
  );

  // Met à jour l'adresse (lien partageable /?a=slug) sans recharger
  const onVariant = useCallback((slug: string) => {
    try {
      window.history.replaceState(null, "", `/?a=${slug}`);
    } catch {}
  }, []);

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPrev(null);
    setActive(0);
    setAnimKey((k) => k + 1);
  };

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Salutation selon l'heure + rotation des messages de bienvenue
  useEffect(() => {
    if (!userName) return;
    const h = new Date().getHours();
    setGreeting(h >= 18 || h < 5 ? "Bonsoir" : "Bonjour");
    setMsgIdx(Math.floor(Math.random() * WELCOME_MESSAGES.length));
    const id = setInterval(
      () => setMsgIdx((i) => (i + 1) % WELCOME_MESSAGES.length),
      WELCOME_ROTATION_MS
    );
    return () => clearInterval(id);
  }, [userName]);

  // Déconnexion (route Better Auth par défaut : /api/auth/sign-out)
  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "same-origin",
      });
    } catch {}
    window.location.assign("/");
  };

  // Panneau détails : ouverture / fermeture animées
  const openDetail = (slug: string) => {
    setDetailSlug(slug);
    requestAnimationFrame(() => requestAnimationFrame(() => setDetailVisible(true)));
  };
  const closeDetail = () => {
    setDetailVisible(false);
    setTimeout(() => setDetailSlug(null), 700);
  };

  // Clavier : flèches pour changer, Échap pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        if (detailSlug) closeDetail();
        return;
      }
      if (searchOpen || detailSlug) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") goTo(active + 1);
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") goTo(active - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Molette : un cran = un slide
  const onWheel = (e: React.WheelEvent) => {
    if (searchOpen || detailSlug || wheelLock.current) return;
    if (Math.abs(e.deltaY) < 30) return;
    const target = active + (e.deltaY > 0 ? 1 : -1);
    if (target < 0 || target >= total) return;
    wheelLock.current = true;
    setTimeout(() => (wheelLock.current = false), 1400);
    goTo(target);
  };

  // Swipe vertical sur mobile
  const onTouchStart = (e: React.TouchEvent) => {
    touchY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchY.current === null || searchOpen || detailSlug) return;
    const delta = e.changedTouches[0].clientY - touchY.current;
    touchY.current = null;
    if (Math.abs(delta) < 50) return;
    const target = active + (delta < 0 ? 1 : -1);
    if (target < 0 || target >= total) return;
    goTo(target);
  };

  return (
    <div
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative h-dvh w-full overflow-hidden overscroll-none bg-background text-foreground"
    >
      {/* Animations + fondu du visuel (désactivées si l'utilisateur réduit les animations) */}
      <style>{`
        @keyframes ah-float {
          0%   { transform: translate3d(0, 0, 0) rotate(0deg); }
          100% { transform: translate3d(8px, -14px, 0) rotate(6deg); }
        }
        @keyframes ah-fade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
        .ah-float { animation: ah-float 8s ease-in-out infinite alternate; }
        .ah-fade  { animation: ah-fade 0.8s ease both; }
        @media (prefers-reduced-motion: reduce) {
          .ah-float, .ah-fade { animation: none; }
        }

        /* Visuel fondu dans la page : les bords partent en transparence.
           Mobile : tous les côtés. */
        .ah-blend {
          -webkit-mask-image:
            linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%),
            linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%);
          -webkit-mask-composite: source-in;
          mask-image:
            linear-gradient(to bottom, transparent 0%, #000 16%, #000 84%, transparent 100%),
            linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%);
          mask-composite: intersect;
        }
        /* Desktop : seul le côté tourné vers le texte se fond,
           le reste touche les bords de l'écran. */
        @media (min-width: 1024px) {
          .ah-blend {
            -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 14%, #000 36%);
            -webkit-mask-composite: source-over;
            mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 14%, #000 36%);
            mask-composite: add;
          }
          .ah-blend-left {
            -webkit-mask-image: linear-gradient(to left, transparent 0%, rgba(0,0,0,0.55) 14%, #000 36%);
            mask-image: linear-gradient(to left, transparent 0%, rgba(0,0,0,0.55) 14%, #000 36%);
          }
        }
      `}</style>

      {/* ─────────── HEADER : logo + titre à gauche, compte à droite ─────────── */}
      <header className="fixed inset-x-0 top-0 z-30 py-3">
        {/* Même conteneur que le texte des slides : les marges gauche et droite sont identiques */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-8 lg:px-12">
          {/* Coin gauche : logo + titre (toujours visibles, même sur mobile) */}
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Automation Hub"
              width={44}
              height={44}
              priority
              className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
            />
            <span className="truncate font-heading text-base uppercase leading-none tracking-wide text-secondary sm:text-xl">
              Automation <span className="text-primary">Hub</span>
            </span>
          </Link>

          {/* Coin droit : admin, recherche, compte */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {isAdmin && (
              <>
                {/* Grand écran : bouton texte */}
                <Link
                  href="/admin"
                  className="hidden rounded-sm border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-foreground-secondary transition hover:border-primary hover:text-primary md:block"
                >
                  Administration
                </Link>
                {/* Mobile : icône seule */}
                <Link
                  href="/admin"
                  aria-label="Administration"
                  title="Administration"
                  className="grid h-10 w-10 place-items-center rounded-sm bg-surface text-foreground shadow-sm transition hover:bg-secondary hover:text-on-secondary md:hidden"
                >
                  <Ico d={icons.shield} className="h-[18px] w-[18px]" />
                </Link>
              </>
            )}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
              className="grid h-10 w-10 place-items-center rounded-sm bg-surface text-foreground shadow-sm transition hover:bg-secondary hover:text-on-secondary"
            >
              <Ico d={icons.search} className="h-[18px] w-[18px]" />
            </button>

            {userName ? (
              /* Connecté : icône de déconnexion */
              <button
                onClick={signOut}
                disabled={signingOut}
                aria-label="Se déconnecter"
                title="Se déconnecter"
                className="grid h-10 w-10 place-items-center rounded-sm bg-surface text-foreground shadow-sm transition hover:bg-secondary hover:text-on-secondary disabled:opacity-50"
              >
                <Ico d={icons.logout} className="h-[18px] w-[18px]" />
              </button>
            ) : (
              /* Non connecté : bouton Google (icône seule sur mobile) */
              <div className="max-sm:[&_button]:gap-0! max-sm:[&_button]:px-2.5! max-sm:[&_button]:py-2.5! max-sm:[&_button]:text-[0px]! max-sm:[&_svg]:h-5! max-sm:[&_svg]:w-5!">
                <AuthButton />
              </div>
            )}
          </div>
        </div>
      </header>
      {/* ─────────── RECHERCHE : une fine ligne légère, sous le header ─────────── */}
      {searchOpen && (
        <button
          aria-label="Fermer la recherche"
          onClick={() => setSearchOpen(false)}
          className="fixed inset-0 z-40 cursor-default"
        />
      )}
      <div
        className="fixed inset-x-0 top-16 z-50 px-4 pt-1 sm:top-[68px]"
        style={{
          opacity: searchOpen ? 1 : 0,
          transform: searchOpen ? "translateY(0)" : "translateY(-14px)",
          pointerEvents: searchOpen ? "auto" : "none",
          transition: `opacity 0.4s ease, transform 0.6s ${EASE}`,
        }}
      >
        <div className="mx-auto max-w-xl">
          <div className="relative flex items-center gap-3 rounded-sm bg-surface/90 px-3 py-2.5 shadow-sm backdrop-blur">
            <Ico d={icons.search} className="h-4 w-4 shrink-0 text-foreground-muted" />
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              placeholder="Rechercher une automatisation…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && total > 0) setSearchOpen(false);
              }}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
            />
            <button
              onClick={() => setSearchOpen(false)}
              aria-label="Fermer"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-sm text-foreground-muted transition hover:bg-background-alt hover:text-foreground"
            >
              <Ico d={icons.x} className="h-4 w-4" />
            </button>
            {/* Ligne fine qui se dessine depuis le centre */}
            <span className="absolute inset-x-0 bottom-0 h-px bg-border-strong" />
            <span
              className="absolute bottom-0 left-1/2 h-px -translate-x-1/2 bg-primary"
              style={{
                width: searchOpen ? "100%" : "0%",
                transition: `width 0.9s ${EASE} 0.15s`,
              }}
            />
          </div>

          {/* Petits résultats (affichés seulement quand on tape) */}
          {q !== "" && (
            <ul className="mt-1 max-h-60 overflow-y-auto rounded-sm border border-border bg-surface/95 shadow-md backdrop-blur">
              {total === 0 && (
                <li className="px-3 py-2.5 text-sm text-foreground-secondary">
                  Aucune automatisation trouvée.
                </li>
              )}
              {filtered.slice(0, 6).map((g, i) => (
                <li key={g.key}>
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      goTo(i);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-background-alt"
                  >
                    <span className="line-clamp-1">{g.variants[0].title}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {g.variants.map((v) => (
                        <span
                          key={v.id}
                          title={v.level}
                          className={`h-2 w-2 rounded-full ${levelDot[v.level] ?? "bg-foreground-muted"}`}
                        />
                      ))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ─────────── GOUTTES D'EAU (navigation, petites, bleu nuit) ─────────── */}
      {total > 1 && (
        <nav
          aria-label="Navigation des automatisations"
          className="fixed right-1.5 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1 sm:right-4 lg:right-7"
        >
          {filtered.map((g, i) => {
            const isOn = i === active;
            return (
              <button
                key={g.key}
                onClick={() => goTo(i)}
                aria-label={`Aller à ${g.variants[0].title}`}
                aria-current={isOn}
                className="grid h-6 w-6 place-items-center"
              >
                {/* Goutte = carré arrondi, pointe en haut (rotation -45°) */}
                <span
                  className={`block -rotate-45 rounded-[50%_0_50%_50%] border-2 transition-all duration-500 ${
                    isOn
                      ? "h-3.5 w-3.5 border-secondary bg-secondary"
                      : "h-2.5 w-2.5 border-foreground-muted bg-transparent hover:border-secondary"
                  }`}
                />
              </button>
            );
          })}
        </nav>
      )}

      {/* ─────────── SLIDES : un par tâche, pas de défilement ─────────── */}
      <div className="absolute inset-0">
        {total === 0 && (
          <div className="grid h-full place-items-center px-6">
            <p className="text-foreground-secondary">Aucune automatisation trouvée.</p>
          </div>
        )}

        {filtered.map((g, i) => {
          const state = i === active ? "active" : i === prev ? "leaving" : "idle";
          return (
            <AutomationSlide
              key={`${g.key}-${animKey}`}
              group={g}
              index={i}
              total={total}
              anim={navCount % 5}
              state={state}
              on={i === active}
              isAdmin={isAdmin}
              welcome={welcome}
              initialSlug={animKey === 0 ? initialSlug : undefined}
              onOpenDetail={openDetail}
              onVariant={onVariant}
            />
          );
        })}
      </div>

      {/* ─────────── PANNEAU « DÉTAILS & CODE » ─────────── */}
      {detail && (
        <DetailPanel
          a={detail}
          visible={detailVisible}
          onClose={closeDetail}
          userName={userName}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

