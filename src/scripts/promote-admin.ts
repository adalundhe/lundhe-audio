/**
 * Bootstrap script: promotes (or demotes) a Clerk user by email.
 *
 * Usage:
 *   pnpm tsx --env-file=.env src/scripts/promote-admin.ts <email> [admin|user]
 *
 * Defaults to "admin" if no role is supplied. Hits the Clerk REST Backend API
 * directly (same pattern used by `src/actions/user/delete.ts`) so we don't
 * have to add `@clerk/backend` as a direct dependency just for a one-off
 * bootstrap.
 */

const CLERK_API_BASE = "https://api.clerk.com/v1";

interface ClerkUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  public_metadata: Record<string, unknown> | null;
}

const fetchUserByEmail = async (
  email: string,
  secretKey: string,
): Promise<ClerkUser> => {
  const url = new URL(`${CLERK_API_BASE}/users`);
  url.searchParams.set("email_address", email);
  url.searchParams.set("limit", "5");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Clerk getUserList failed: ${response.status} ${response.statusText} — ${text}`,
    );
  }

  const users = (await response.json()) as ClerkUser[];

  if (users.length === 0) {
    throw new Error(`No Clerk user found with email "${email}".`);
  }

  if (users.length > 1) {
    throw new Error(
      `Found ${users.length} users with that email — refusing to act ambiguously. IDs: ${users
        .map((u) => u.id)
        .join(", ")}`,
    );
  }

  return users[0]!;
};

const updateUserMetadata = async (
  userId: string,
  publicMetadata: Record<string, unknown>,
  secretKey: string,
): Promise<ClerkUser> => {
  const response = await fetch(`${CLERK_API_BASE}/users/${userId}/metadata`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      public_metadata: publicMetadata,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Clerk updateUserMetadata failed: ${response.status} ${response.statusText} — ${text}`,
    );
  }

  return (await response.json()) as ClerkUser;
};

const main = async () => {
  const [, , emailArg, roleArgRaw] = process.argv;
  const roleArg = roleArgRaw ?? "admin";

  if (!emailArg) {
    console.error(
      "Usage: pnpm tsx --env-file=.env src/scripts/promote-admin.ts <email> [admin|user]",
    );
    process.exit(1);
  }

  if (roleArg !== "admin" && roleArg !== "user") {
    console.error(`Invalid role "${roleArg}". Must be "admin" or "user".`);
    process.exit(1);
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error(
      "CLERK_SECRET_KEY is not set. Make sure your .env file has it and that you are running with --env-file=.env",
    );
    process.exit(1);
  }

  console.log(`Looking up user by email: ${emailArg}`);
  const user = await fetchUserByEmail(emailArg, secretKey);

  const previousRole = user.public_metadata?.role ?? "(none)";
  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    "(no name)";

  console.log(`Found user ${user.id} (${fullName}). Previous role: ${String(previousRole)}`);

  const updated = await updateUserMetadata(
    user.id,
    {
      ...(user.public_metadata ?? {}),
      role: roleArg,
    },
    secretKey,
  );

  console.log(
    `OK. New role for ${updated.id}: ${String(updated.public_metadata?.role)}`,
  );
  console.log(
    "Tip: existing sessions may need to refresh (sign out + back in, or wait a minute) before the role propagates.",
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
