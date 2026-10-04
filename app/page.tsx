import { getAutomations } from "@/data/db";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const automations = await getAutomations();
  return <HomeClient automations={automations} />;
}