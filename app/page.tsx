import { headers } from "next/headers";
import { getAutomations } from "@/data/db";
import { getAuth } from "@/lib/auth";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ a?: string }>;
}) {
  const { a } = await searchParams;
  const automations = await getAutomations();
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