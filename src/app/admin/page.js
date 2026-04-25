import AdminDashboard from "@/components/AdminDashboard";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireAdminSession } from "@/lib/admin-auth";
import { getCollections, getProducts } from "@/lib/catalog-store";
import { unstable_noStore as noStore } from "next/cache";

export const metadata = {
  title: "Admin Dashboard | SMS TEX SAREES",
};

export default async function AdminPage() {
  noStore();

  const session = await requireAdminSession();
  const [collections, products] = await Promise.all([getCollections(), getProducts()]);

  return (
    <>
      <main className="min-h-[70vh] bg-[#fbfaf7]">
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-5 rounded-[16px] border border-[#efe7dc] bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#94773c]">
                Protected admin
              </p>
              <h1 className="mt-3 font-serif text-4xl text-[#43242d] sm:text-5xl">
                Catalog dashboard
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#6d6064] sm:text-lg">
                Signed in as {session.email}. Images upload to Cloudinary and catalog updates save
                to Firebase.
              </p>
            </div>
            <AdminLogoutButton />
          </div>

          <AdminDashboard collections={collections} products={products} />
        </section>
      </main>
    </>
  );
}
