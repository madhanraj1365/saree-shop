import AdminSelection from "@/components/AdminSelection";
import { requireAdminSession } from "@/lib/admin-auth";
import { unstable_noStore as noStore } from "next/cache";

export const metadata = {
  title: "Admin Portal | SMS TEX SAREES",
};

export default async function AdminPage() {
  noStore();

  const session = await requireAdminSession();

  return <AdminSelection email={session.email} />;
}
