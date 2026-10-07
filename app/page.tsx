import { headers } from "next/headers";
import { getDailyAutomations, getGroupBySlug } from "@/data/db";
import { getAuth } from "@/lib/auth";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ a?: string }>;
}) {
  const { a } = await searchParams;
  const daily = await getDailyAutomations();
  let automations = daily;

  // Lien vers une tâche qui n'est pas dans les 5 du jour : on l'ajoute en premier
  if (a && !daily.some((x) => x.slug === a)) {
    const group = await getGroupBySlug(a);
    if (group.length > 0) {
      const key = group[0].title.trim().toLowerCase();
      automations = [
        ...group,
        ...daily.filter((x) => x.title.trim().toLowerCase() !== key),
      ];
    }
  }
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user.role === "admin";
  const userName = session?.user.name ?? null;

  return (
    <HomeClient
      automations={automations}
      isAdmin={isAdmin}
      initialSlug={a}
      userName={userName}
    />
  );
}