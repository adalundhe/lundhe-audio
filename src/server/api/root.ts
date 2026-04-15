import { contactRouter } from "~/server/api/routers/contact";
import { mixQuotesRouter } from "./routers/quotes";
import { adminOrdersRouter } from "./routers/admin-orders";
import { adminUsersRouter } from "./routers/admin-users";
import { adminCouponsRouter } from "./routers/admin-coupons";
import { adminGearRouter } from "./routers/admin-gear";
import { adminManifestsRouter } from "./routers/admin-manifests";
import { adminProductsRouter } from "./routers/admin-products";
import { adminDiscountsRouter } from "./routers/admin-discounts";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  contact: contactRouter,
  mixQuotes: mixQuotesRouter,
  adminOrders: adminOrdersRouter,
  adminUsers: adminUsersRouter,
  adminCoupons: adminCouponsRouter,
  adminGear: adminGearRouter,
  adminManifests: adminManifestsRouter,
  adminProducts: adminProductsRouter,
  adminDiscounts: adminDiscountsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
