export type UserRole = "admin" | "user";

/**
 * Augments Clerk's session claims so `auth().sessionClaims.metadata.role` is
 * strongly typed wherever Clerk's server helpers are used.
 *
 * Requires the Clerk JWT template (the default `__session` token) to publish
 * `{"metadata": "{{user.public_metadata}}"}`. With that one-time dashboard
 * change, the role rides on every session token and is readable in middleware
 * at the edge with no DB hop and no Clerk API call.
 */
declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: UserRole;
    };
  }
}

export {};
