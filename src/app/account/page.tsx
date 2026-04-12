import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Layout } from "~/components/Layout";
import { api } from "~/lib/server-client";
import { getCurrentUserRole } from "~/server/auth/roles";
import { getAllOrdersForAdmin } from "~/server/orders";
import { getOrdersForUser } from "~/server/orders";

import {
  AccountDashboardClient,
  type AdminDashboardData,
} from "./_components/account-dashboard-client";

export default async function AccountDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { role } = await getCurrentUserRole();


  // TEMP DEBUG — remove once admin gating is verified.
  // eslint-disable-next-line no-console
  console.log("[account page] role from getCurrentUserRole:", role, "userId:", userId, "publicMetadata.role:", user.publicMetadata?.role);

  // Personal data: every signed-in user gets these.
  const { orders, isAvailable } = await getOrdersForUser(userId);

  // Admin data: only fetched when the caller is actually an admin so the
  // /account page stays cheap for everyone else. Both calls are server-side
  // so the admin data never appears in the network response for non-admins.
  let adminData: AdminDashboardData | null = null;
  if (role === "admin") {
    const trpc = await api();
    const [allOrders, usersResult] = await Promise.all([
      getAllOrdersForAdmin(),
      trpc.adminUsers.list(),
    ]);
    adminData = {
      orders: allOrders.orders,
      users: usersResult.users,
      usersTotalCount: usersResult.totalCount,
    };
  }

  // eslint-disable-next-line no-console
  console.log("[account page] adminData populated?", adminData !== null);

  const nameFromParts = [user.firstName, user.lastName]
    .filter((value): value is string => Boolean(value))
    .join(" ");
  const fullName = user.fullName ?? (nameFromParts || "Unknown");
  const firstInitial = user.firstName?.at(0) ?? "N";
  const lastInitial = user.lastName?.at(0) ?? "A";
  const primaryEmail =
    user.emailAddresses.find(
      (emailAddress) => emailAddress.id === user.primaryEmailAddressId,
    )?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "No email";

  return (
    <Layout>
      <AccountDashboardClient
        profile={{
          id: user.id,
          fullName,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          email: primaryEmail,
          imageUrl: user.imageUrl,
          initials: `${firstInitial}${lastInitial}`,
          memberSince: user.createdAt
            ? new Date(user.createdAt).toDateString()
            : "Unknown",
        }}
        orders={orders}
        ordersAvailable={isAvailable}
        adminData={adminData}
      />
    </Layout>
  );
}
