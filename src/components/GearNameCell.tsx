import { useMemo } from "react"
import { type Row } from "@tanstack/react-table"
import { type EquipmentItem } from "~/server/api/routers/equipment"


export const GearNameCell = ({
    row
}: {
   row: Row<EquipmentItem>
}) => {

    const isNew = useMemo(() => {

        const added = new Date(row.getValue("added"))
        const deltaMilliseconds = Math.abs(new Date().getTime() - added.getTime())

        const total_seconds = Math.floor(deltaMilliseconds / 1000);
        const total_minutes = Math.floor(total_seconds / 60);
        const total_hours = Math.floor(total_minutes / 60);

        return Math.floor(total_hours / 24) < 30


    }, [row])

    const name = useMemo(() => row.getValue("name"), [row])

    return (
        isNew
        ?
        <div className="capitalize truncate text-ellipsis">{name as string} <b>NEW!</b></div>
        :

        <div className="capitalize truncate text-ellipsis">{name as string}</div>
    )
}