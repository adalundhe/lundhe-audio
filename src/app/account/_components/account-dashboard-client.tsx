"use client";

import * as React from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { LayoutDashboard, Loader2, Trash2 } from "lucide-react";

import { deleteAccount } from "~/actions/user/delete";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { AdminOrderListItem } from "~/server/orders";
import type { AdminUserListItem } from "~/server/api/routers/admin-users";
import type { OrderListItem } from "~/types/orders";

import { AdminOrdersSection } from "./admin-orders-section";
import { AdminUsersSection } from "./admin-users-section";
import { OrdersTable } from "./orders-table";
import { ProfileCard } from "./profile-card";

export interface AdminDashboardData {
  orders: AdminOrderListItem[];
  users: AdminUserListItem[];
  usersTotalCount: number;
}

export function AccountDashboardClient({
  profile,
  orders,
  ordersAvailable,
  adminData,
}: {
  profile: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    imageUrl: string | null;
    initials: string;
    memberSince: string;
  };
  orders: OrderListItem[];
  ordersAvailable: boolean;
  adminData: AdminDashboardData | null;
}) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { signOut } = useClerk();

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await deleteAccount(profile.id);
      await signOut({ redirectUrl: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full space-y-6 self-start py-6 xl:w-3/4">
      {adminData ? (
        <div className="flex justify-end">
          <Button asChild className="border rounded-sm dark:hover:bg-white dark:hover:text-black hover:bg-black hover:text-white">
            <Link href="/admin">
              <LayoutDashboard className="!h-[16px] !w-[16px]" />
              Admin Dashboard
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-stretch">
        <ProfileCard profile={profile} />

        <div className="min-w-0">
          <OrdersTable orders={orders} ordersAvailable={ordersAvailable} />
        </div>
      </div>

      {adminData ? (
        <div className="w-full space-y-6">
          <AdminOrdersSection initialOrders={adminData.orders} />
          <AdminUsersSection
            initialUsers={adminData.users}
            totalCount={adminData.usersTotalCount}
            currentUserId={profile.id}
          />
        </div>
      ) : null}

      <div className="w-full xl:flex xl:justify-center">
        <Card className="w-full border-red-500/50 xl:max-w-xl">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            {error && (
              <div className="mb-4 w-full rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full border border-red-500 text-red-500 hover:bg-red-800/30 sm:w-auto">
                  <Trash2 className="mr-2 !h-4 !w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="mx-4">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove all associated data from our
                    servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={isDeleting}
                    className="border hover:bg-black dark:border-white dark:hover:bg-white dark:hover:text-black"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="border border-red-500 text-red-500 hover:bg-red-800/30"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 !h-4 !w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Confirm"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
