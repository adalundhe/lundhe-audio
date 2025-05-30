
import { EquipmentItem} from "~/stores/gear-store";
import { Button } from "~/components/ui/button"
import { TableCell } from "~/components/ui/table"
import {
    Table,
    Cell,
    flexRender,
} from '@tanstack/react-table'
import { useMemo } from "react";


export const FilterCell = ({
    table,
    cell,
    filterColumn,
}: {
    table: Table<EquipmentItem>
    cell: Cell<EquipmentItem, unknown>,
    filterColumn: string,
}) => {

    
    const column = useMemo(() => filterColumn, [filterColumn])

    const filterValue = table.getColumn(column)?.getFilterValue()
    const filter = useMemo(() => filterValue, [filterValue])
    const value = useMemo(() =>  cell.getValue(), [cell])

    return (
        <TableCell 
        key={cell.id}
        style={{
            width: cell.column.getSize(),
            minWidth: cell.column.columnDef.minSize
        }}
        >
        <Button 
            className={`hover:text-cyan-500 p-0 h-fit ${filter === value ? 'text-cyan-500' : ''}`}
            onClick={() => table.getColumn(column)?.setFilterValue(
            filter === value ?
            ""
            :
            value
            )}
        >
        {flexRender(
            cell.column.columnDef.cell,
            cell.getContext()
        )}
        </Button>
        </TableCell> 
    )
}