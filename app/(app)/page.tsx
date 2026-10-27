import { getSessionsWithSetsForUser } from "@/lib/sessions/data";
import { HomeView } from "./home-view";

export default async function Home() {
  return <HomeView sessions={await getSessionsWithSetsForUser()} />;
}
