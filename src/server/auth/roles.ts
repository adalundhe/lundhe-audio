import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import type { UserRole } from "~/types/roles";

const ROLES: readonly UserRole[] = ["admin", "user"] as const;

const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && (ROLES as readonly string[]).includes(value);

/**
 * Normalize an arbitrary metadata `role` value into a `UserRole`. Anything that
 * is not the literal string `"admin"` collapses to `"user"` so callers never
 * have to deal with `undefined`.
 */
export const normalizeRole = (value: unknown): UserRole =>
  isUserRole(value) ? value : "user";

/**
 * Reads the current user's role from the Clerk session JWT first (zero
 * round-trips, edge-friendly) and only falls back to `currentUser()` when the
 * JWT template hasn't propagated the metadata yet — for example, immediately
 * after a fresh promotion before the session token has been refreshed.
 */
export const getCurrentUserRole = async (): Promise<{
  userId: string | null;
  role: UserRole;
}> => {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { userId: null, role: "user" };
  }

  const claimRole = sessionClaims?.metadata?.role;
  if (isUserRole(claimRole)) {
    return { userId, role: claimRole };
  }

  // Fallback: pull metadata directly from Clerk. This costs a request, but
  // only fires when the JWT template hasn't been configured yet, or when a
  // role change has not yet been refreshed into the session token.
  const user = await currentUser();
  return {
    userId,
    role: normalizeRole(user?.publicMetadata?.role),
  };
};

export const isAdminRole = (role: UserRole): role is "admin" =>
  role === "admin";
