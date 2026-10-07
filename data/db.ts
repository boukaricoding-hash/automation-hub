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