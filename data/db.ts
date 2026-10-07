import { getCloudflareContext } from "@opennextjs/cloudflare";

export type Automation = {
  id: number;
  slug: string;
  title: string;
  description: string;
  subtitle: string | null;
  image: string | null;
  category: string | null;
  level: string;
  fileType: string;
  platform: string;
  requirements: string;
  code: string | null;
};

type Row = {
  id: number;
  slug: string;
  title: string;
  description: string;
  subtitle: string | null;
  image: string | null;
  category: string | null;
  level: string;
  file_type: string;
  platform: string;
  requirements: string;
  code: string | null;
};

const COLUMNS =
  "id, slug, title, description, subtitle, image, category, level, file_type, platform, requirements, code";

function toAutomation(row: Row): Automation {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    subtitle: row.subtitle,
    image: row.image,
    category: row.category,
    level: row.level,
    fileType: row.file_type,
    platform: row.platform,
    requirements: row.requirements,
    code: row.code,
  };
}

export async function getAutomations(): Promise<Automation[]> {
  const { env } = await getCloudflareContext({ async: true });
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM automations ORDER BY id`
  ).all<Row>();
  return results.map(toAutomation);
}

export async function getAutomationBySlug(
  slug: string
): Promise<Automation | null> {
  const { env } = await getCloudflareContext({ async: true });
  const row = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM automations WHERE slug = ?`
  )
    .bind(slug)
    .first<Row>();
  return row ? toAutomation(row) : null;
}

export type NewAutomation = {
  slug: string;
  title: string;
  description: string;
  subtitle?: string | null;
  image?: string | null;
  level: string;
  fileType: string;
  platform: string;
  requirements: string;
  code: string;
};

export async function createAutomation(a: NewAutomation): Promise<void> {
  const { env } = await getCloudflareContext({ async: true });
  await env.DB.prepare(
    `INSERT INTO automations (slug, title, description, subtitle, image, level, file_type, platform, requirements, code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      a.slug,
      a.title,
      a.description,
      a.subtitle ?? null,
      a.image ?? null,
      a.level,
      a.fileType,
      a.platform,
      a.requirements,
      a.code
    )
    .run();
}

export async function updateAutomation(a: NewAutomation): Promise<boolean> {
  const { env } = await getCloudflareContext({ async: true });
  const result = await env.DB.prepare(
    `UPDATE automations
     SET title = ?, description = ?,
         subtitle = COALESCE(?, subtitle),
         image = COALESCE(?, image),
         level = ?, file_type = ?,
         platform = ?, requirements = ?, code = ?
     WHERE slug = ?`
  )
    .bind(
      a.title,
      a.description,
      a.subtitle ?? null,
      a.image ?? null,
      a.level,
      a.fileType,
      a.platform,
      a.requirements,
      a.code,
      a.slug
    )
    .run();
  return result.meta.changes > 0;
}

export async function deleteAutomation(slug: string): Promise<boolean> {
  const { env } = await getCloudflareContext({ async: true });
  await env.DB.prepare(`DELETE FROM reviews WHERE automation_slug = ?`)
    .bind(slug)
    .run();
  const result = await env.DB.prepare(
    `DELETE FROM automations WHERE slug = ?`
  )
    .bind(slug)
    .run();
  return result.meta.changes > 0;
}

/* ───────────── AVIS ───────────── */

export type Review = {
  id: number;
  automationSlug: string;
  userId: string;
  userName: string;
  image: string | null;
  rating: number;
  comment: string;
  createdAt: string;
};

type ReviewRow = {
  id: number;
  automation_slug: string;
  user_id: string;
  user_name: string;
  image: string | null;
  rating: number;
  comment: string;
  created_at: string;
};

const REVIEW_COLUMNS =
  "id, automation_slug, user_id, user_name, rating, comment, created_at";

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    automationSlug: row.automation_slug,
    userId: row.user_id,
    userName: row.user_name,
    image: row.image,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

// Les avis d'une automatisation, du plus récent au plus ancien
export async function getReviews(slug: string): Promise<Review[]> {
  const { env } = await getCloudflareContext({ async: true });
  const { results } = await env.DB.prepare(
    `SELECT r.id, r.automation_slug, r.user_id, r.user_name, u.image, r.rating, r.comment, r.created_at
     FROM reviews r
     LEFT JOIN user u ON u.id = r.user_id
     WHERE r.automation_slug = ?
     ORDER BY r.id DESC`
  )
    .bind(slug)
    .all<ReviewRow>();
  return results.map(toReview);
}

// Ajoute l'avis, ou le remplace si la personne en avait déjà un sur cette automatisation
export async function saveReview(r: {
  slug: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const { env } = await getCloudflareContext({ async: true });
  await env.DB.prepare(
    `INSERT INTO reviews (automation_slug, user_id, user_name, rating, comment)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (automation_slug, user_id)
     DO UPDATE SET rating = excluded.rating,
                   comment = excluded.comment,
                   user_name = excluded.user_name,
                   created_at = datetime('now')`
  )
    .bind(r.slug, r.userId, r.userName, r.rating, r.comment)
    .run();
}

// Supprime un avis. Avec userId : seulement si c'est le sien. Sans userId (admin) : n'importe lequel.
export async function deleteReview(
  id: number,
  userId?: string
): Promise<boolean> {
  const { env } = await getCloudflareContext({ async: true });
  const result = userId
    ? await env.DB.prepare(`DELETE FROM reviews WHERE id = ? AND user_id = ?`)
        .bind(id, userId)
        .run()
    : await env.DB.prepare(`DELETE FROM reviews WHERE id = ?`).bind(id).run();
  return result.meta.changes > 0;
}

/* ───────────── ACCUEIL : 5 AUTOMATISATIONS PAR JOUR ───────────── */

// Nombre de slides affichés à l'accueil
export const HOME_COUNT = 5;

// Renvoie les automatisations du jour : 5 titres uniques qui changent chaque jour,
// puis la liste boucle et reprend au début.
export async function getDailyAutomations(): Promise<Automation[]> {
  const { env } = await getCloudflareContext({ async: true });

  // Nombre de tâches (titres uniques)
  const countRow = await env.DB.prepare(
    `SELECT COUNT(DISTINCT lower(trim(title))) AS n FROM automations`
  ).first<{ n: number }>();
  const n = countRow?.n ?? 0;
  if (n === 0) return [];

  // Point de départ du jour (le numéro du jour change à minuit UTC, comme au Togo)
  const day = Math.floor(Date.now() / 86400000);
  const start = n <= HOME_COUNT ? 0 : (day * HOME_COUNT) % n;

  const pick = async (limit: number, offset: number) => {
    const { results } = await env.DB.prepare(
      `SELECT lower(trim(title)) AS k FROM automations
       GROUP BY lower(trim(title)) ORDER BY MIN(id) LIMIT ? OFFSET ?`
    )
      .bind(limit, offset)
      .all<{ k: string }>();
    return results.map((r) => r.k);
  };

  // Les 5 titres du jour, et si on arrive à la fin de la liste, on complète depuis le début
  let keys = await pick(HOME_COUNT, start);
  if (keys.length < HOME_COUNT && n > HOME_COUNT) {
    keys = keys.concat(await pick(HOME_COUNT - keys.length, 0));
  }

  // Toutes les variantes (niveaux) de ces 5 titres
  const marks = keys.map(() => "?").join(",");
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNS}, lower(trim(title)) AS k FROM automations
     WHERE lower(trim(title)) IN (${marks}) ORDER BY id`
  )
    .bind(...keys)
    .all<Row & { k: string }>();

  // On garde l'ordre des titres choisis
  results.sort((a, b) => keys.indexOf(a.k) - keys.indexOf(b.k));
  return results.map(toAutomation);
}
// Toutes les variantes (niveaux) de la tâche qui contient ce slug
export async function getGroupBySlug(slug: string): Promise<Automation[]> {
  const { env } = await getCloudflareContext({ async: true });
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM automations
     WHERE lower(trim(title)) = (SELECT lower(trim(title)) FROM automations WHERE slug = ?)
     ORDER BY id`
  )
    .bind(slug)
    .all<Row>();
  return results.map(toAutomation);
}

/* ───────────── PAGE « VOIR TOUTES » : recherche + pagination ───────────── */

export const ALL_PER_PAGE = 24;

export type AutomationCard = {
  key: string;
  slug: string; // slug du niveau le plus bas (celui qu'on ouvre)
  title: string;
  subtitle: string | null;
  category: string | null;
  levels: string[];
  fileType: string;
  platform: string;
};

export async function searchAutomations(
  rawQuery: string,
  page: number
): Promise<{ items: AutomationCard[]; total: number }> {
  const { env } = await getCloudflareContext({ async: true });

  const q = rawQuery.replace(/[%_]/g, "").trim();
  const filter = q
    ? `WHERE (title LIKE ? OR category LIKE ? OR subtitle LIKE ?)`
    : "";
  const args: string[] = q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [];

  // Nombre de tâches (titres uniques) qui correspondent
  const countRow = await env.DB.prepare(
    `SELECT COUNT(DISTINCT lower(trim(title))) AS n FROM automations ${filter}`
  )
    .bind(...args)
    .first<{ n: number }>();
  const total = countRow?.n ?? 0;
  if (total === 0) return { items: [], total: 0 };

  // Les titres de la page demandée
  const offset = (Math.max(page, 1) - 1) * ALL_PER_PAGE;
  const { results: keyRows } = await env.DB.prepare(
    `SELECT lower(trim(title)) AS k FROM automations ${filter}
     GROUP BY lower(trim(title)) ORDER BY MIN(id) LIMIT ? OFFSET ?`
  )
    .bind(...args, ALL_PER_PAGE, offset)
    .all<{ k: string }>();
  const keys = keyRows.map((r) => r.k);
  if (keys.length === 0) return { items: [], total };

  // Les niveaux de ces titres (sans le code)
  const marks = keys.map(() => "?").join(",");
  const { results } = await env.DB.prepare(
    `SELECT slug, title, subtitle, category, level, file_type, platform,
            lower(trim(title)) AS k
     FROM automations WHERE lower(trim(title)) IN (${marks}) ORDER BY id`
  )
    .bind(...keys)
    .all<{
      slug: string;
      title: string;
      subtitle: string | null;
      category: string | null;
      level: string;
      file_type: string;
      platform: string;
      k: string;
    }>();

  const order = ["Débutant", "Intermédiaire", "Avancé"];
  const rank = (l: string) => {
    const i = order.indexOf(l);
    return i === -1 ? 99 : i;
  };

  const items: AutomationCard[] = keys.map((k) => {
    const vs = results
      .filter((r) => r.k === k)
      .sort((a, b) => rank(a.level) - rank(b.level));
    const first = vs[0];
    return {
      key: k,
      slug: first.slug,
      title: first.title,
      subtitle: first.subtitle,
      category: first.category,
      levels: vs.map((v) => v.level),
      fileType: first.file_type,
      platform: first.platform,
    };
  });

  return { items, total };
}