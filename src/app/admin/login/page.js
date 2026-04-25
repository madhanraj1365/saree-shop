import AdminLoginForm from "@/components/AdminLoginForm";
import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Login | SMS TEX SAREES",
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  return (
    <>
      <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#94773c]">
          Secure access
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#43242d] sm:text-5xl">Admin sign in</h1>
        <div className="mt-10 rounded-[16px] border border-[#efe7dc] bg-[#fbfaf7] p-6 sm:p-8">
          <p className="text-base leading-7 text-[#6d6064]">
            Sign in with the Firebase email/password account for {process.env.ADMIN_EMAIL}. This
            page creates a secure server-side admin session before opening the dashboard.
          </p>
          <AdminLoginForm />
        </div>
      </main>
    </>
  );
}
