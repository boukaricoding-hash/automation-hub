import { getCloudflareContext } from "@opennextjs/cloudflare";

export type Automation = {
  id: number;
  slug: string;
  title: string;
  description: string;
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
  category: string | null;
  level: string;
  file_type: string;
  platform: string;
  requirements: string;
  code: string | null;
};

const COLUMNS =
  "id, slug, title, description, category, level, file_type, platform, requirements, code";

function toAutomation(row: Row): Automation {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
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