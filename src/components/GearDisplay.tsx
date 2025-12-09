import { GearTable } from './GearTable'
import { db } from '~/server/db/client';
import { equipmentItem } from "~/server/db/schema"



export const GearDisplay = async () => {

    const data =  await db.select().from(equipmentItem)

    return (
        <GearTable data={data} />
    )
}