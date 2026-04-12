import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";

import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { coupons } from "~/server/db/schema";

const CODE_LENGTH = 12;
// Excludes ambiguous characters (0/O, 1/I/L) so codes are easy to read aloud.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const MAX_GENERATION_ATTEMPTS = 5;

const generateCandidateCode = () => {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return code;
};

const isUniqueViolation = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  return /unique/i.test(error.message) && /code/i.test(error.message);
};

export const adminCouponsRouter = createTRPCRouter({
  generate: adminProcedure.mutation(async ({ ctx }) => {
    // Retry on the (very unlikely) chance two generated codes collide. Bail
    // after a few attempts so a misconfigured DB can't spin forever.
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
      const code = generateCandidateCode();
      try {
        const inserted = await ctx.db
          .insert(coupons)
          .values({
            id: crypto.randomUUID(),
            code,
          })
          .returning()
          .get();

        return {
          id: inserted.id,
          code: inserted.code,
          createdAt: inserted.created_timestamp,
        };
      } catch (error) {
        if (isUniqueViolation(error)) continue;
        throw error;
      }
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Could not generate a unique coupon code after several attempts. Try again.",
    });
  }),
});
