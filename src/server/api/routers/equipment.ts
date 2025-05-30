import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { equipmentItem } from "~/server/db/schema"

export type EquipmentItem = {
    name: string
    description: string
    type: string
    group: string
    quantity: number
}


export const equipmentItemRouter = createTRPCRouter({
    getAllEquipment: publicProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
        return await ctx.db
            .select()
            .from(equipmentItem)

    })
})