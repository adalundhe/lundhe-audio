import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { Layout } from "~/components/Layout";
import { getOrderDetailForUser } from "~/server/order-detail";

import { OrderDetailClient } from "./_components/order-detail-client";

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { orderId } = await params;
  const order = await getOrderDetailForUser({
    userId,
    orderId,
  });

  if (!order) {
    notFound();
  }

  return (
    <Layout>
      <OrderDetailClient order={order} />
    </Layout>
  );
}
