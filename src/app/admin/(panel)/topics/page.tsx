import { TopicsManager } from "@/components/admin/TopicsManager";
import { getAdminTopics } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  return <TopicsManager topics={await getAdminTopics()} />;
}
