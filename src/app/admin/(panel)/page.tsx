import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getAdminData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getAdminData();
  return <AdminDashboard {...data} />;
}
