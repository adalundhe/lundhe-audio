import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Layout } from "~/components/Layout";
import { getOrdersForUser } from "~/server/orders";

import { AccountDashboardClient } from "./_components/account-dashboard-client";

export default async function AccountDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { orders, isAvailable } = await getOrdersForUser(userId);
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
      />
    </Layout>
  );
}
