import AdminDashboard from "@/components/AdminDashboard";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireAdminSession } from "@/lib/admin-auth";
import { getCollections, getProducts } from "@/lib/catalog-store";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

export const metadata = {
  title: "Catalog Management | SMS TEX SAREES",
};

export default async function AdminCatalogPage() {
  noStore();

  const session = await requireAdminSession();
  const [collections, products] = await Promise.all([getCollections(), getProducts()]);

  return (
    <main className="min-h-screen bg-[#fbfaf7] py-10">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 rounded-[16px] border border-[#efe7dc] bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="text-xs font-bold uppercase tracking-widest text-[#94773c] hover:text-[#8b001c] mb-2 inline-block">
              &larr; Back to Selection
            </Link>
            <h1 className="font-serif text-4xl text-[#43242d]">Catalog Manager</h1>
            <p className="mt-2 text-[#6d6064]">Signed in as {session.email}</p>
          </div>
          <AdminLogoutButton />
        </div>

        <AdminDashboard collections={collections} products={products} />
      </section>
    </main>
  );
}
