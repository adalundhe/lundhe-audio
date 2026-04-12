import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";

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

const couponInputSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required."),
  couponType: z.enum(["flat", "percentage"]),
  amount: z.number().positive("Amount must be greater than 0."),
});

export const adminCouponsRouter = createTRPCRouter({
  generate: adminProcedure.mutation(() => ({
    code: generateCandidateCode(),
  })),

  create: adminProcedure
    .input(couponInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const inserted = await ctx.db
          .insert(coupons)
          .values({
            id: crypto.randomUUID(),
            code: input.code.trim().toUpperCase(),
            couponType: input.couponType,
            amount: Number(input.amount.toFixed(2)),
          })
          .returning()
          .get();

        return {
          id: inserted.id,
          code: inserted.code,
          couponType: inserted.couponType,
          amount: inserted.amount,
          createdAt: inserted.created_timestamp,
        };
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "That coupon code already exists. Generate a new code and try again.",
          });
        }

        throw error;
      }
    }),
});
