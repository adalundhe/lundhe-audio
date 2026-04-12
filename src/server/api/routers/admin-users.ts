import { TRPCError } from "@trpc/server";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { normalizeRole } from "~/server/auth/roles";
import type { UserRole } from "~/types/roles";

export interface AdminUserListItem {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  createdAt: number;
  lastSignInAt: number | null;
  role: UserRole;
}

const roleSchema = z.enum(["admin", "user"]);

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export const adminUsersRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(MAX_LIMIT).optional(),
          offset: z.number().int().min(0).optional(),
          query: z.string().trim().min(1).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? DEFAULT_LIMIT;
      const offset = input?.offset ?? 0;

      const client = await clerkClient();
      const response = await client.users.getUserList({
        limit,
        offset,
        ...(input?.query ? { query: input.query } : {}),
        orderBy: "-created_at",
      });

      const users: AdminUserListItem[] = response.data.map((user) => {
        const primaryEmail =
          user.emailAddresses.find(
            (email) => email.id === user.primaryEmailAddressId,
          )?.emailAddress ??
          user.emailAddresses[0]?.emailAddress ??
          null;

        return {
          id: user.id,
          email: primaryEmail,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          createdAt: user.createdAt,
          lastSignInAt: user.lastSignInAt,
          role: normalizeRole(user.publicMetadata?.role),
        };
      });

      return {
        users,
        totalCount: response.totalCount,
        limit,
        offset,
      };
    }),

  setRole: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        role: roleSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Self-demotion guard: prevents an admin from accidentally locking
      // themselves out of every admin surface in a single click. They can
      // still be demoted by another admin.
      if (input.userId === ctx.auth.userId && input.role !== "admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "You cannot remove your own admin role. Ask another admin to do it.",
        });
      }

      const client = await clerkClient();

      // Read existing metadata first so we don't clobber unrelated keys.
      const existing = await client.users.getUser(input.userId).catch(() => {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      });

      const nextMetadata = {
        ...(existing.publicMetadata ?? {}),
        role: input.role,
      };

      const updated = await client.users.updateUserMetadata(input.userId, {
        publicMetadata: nextMetadata,
      });

      return {
        id: updated.id,
        role: normalizeRole(updated.publicMetadata?.role),
      };
    }),
});
