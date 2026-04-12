import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { orders } from "~/server/db/schema";
import { getAllOrdersForAdmin } from "~/server/orders";

const workflowStatusValues = [
  "awaiting-files",
  "queued",
  "in-progress",
  "awaiting-feedback",
  "revision-in-progress",
  "completed",
  "on-hold",
  "cancelled",
] as const;

const workflowStatusSchema = z.enum(workflowStatusValues);

export const adminOrdersRouter = createTRPCRouter({
  list: adminProcedure.query(async () => {
    return getAllOrdersForAdmin();
  }),

  updateWorkflowStatus: adminProcedure
    .input(
      z.object({
        orderId: z.string().min(1),
        workflowStatus: workflowStatusSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(orders)
        .set({
          workflowStatus: input.workflowStatus,
          updated_timestamp: new Date().toISOString(),
        })
        .where(eq(orders.id, input.orderId))
        .returning()
        .get();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found.",
        });
      }

      return {
        id: updated.id,
        workflowStatus: updated.workflowStatus,
      };
    }),
});
