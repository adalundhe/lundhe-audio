import { redirect } from "next/navigation";

import { Layout } from "~/components/Layout";
import { getCurrentUserRole } from "~/server/auth/roles";

import { AdminSidebar } from "./_components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: middleware already gates /admin, but a server-side check
  // here ensures any direct render path (RSC, server actions, prefetch) cannot
  // bypass the role guard.
  const { userId, role } = await getCurrentUserRole();

  if (!userId) {
    redirect("/sign-in");
  }

  if (role !== "admin") {
    redirect("/account");
  }

  return (
    <Layout>
      <div className="relative w-full">
        <AdminSidebar />
        <div className="mx-auto w-full max-w-7xl min-w-0 py-6 xl:w-11/12">
          <div className="flex w-full min-w-0 flex-col items-stretch">{children}</div>
        </div>
      </div>
    </Layout>
  );
}
