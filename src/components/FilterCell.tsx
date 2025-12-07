
import { type EquipmentItem } from "~/server/db/schema";
import { Button } from "~/components/ui/button"
import { TableCell } from "~/components/ui/table"
import {
    type Table,
    type Cell,
    type Row,
    flexRender,
} from '@tanstack/react-table'
import { useMemo } from "react";



export const resetFilters = (table: Table<EquipmentItem>) => {

  const groupColumn = table.getColumn("group");
  if (groupColumn?.getFilterValue() !== "") {
    groupColumn?.setFilterValue("")
  }

  const typeColumn = table.getColumn("type");
  if (typeColumn?.getFilterValue() !== "") {
    typeColumn?.setFilterValue("")
  }

  const manufacturerColumn = table.getColumn("manufacturer")
  if (manufacturerColumn?.getFilterValue() !== "") {
    manufacturerColumn?.setFilterValue("")
  }
 

}

export const FilterCell = ({
    table,
    row,
    cell,
    filterColumn,
    groupColumn,
}: {
    table: Table<EquipmentItem>
    row: Row<EquipmentItem>,
    cell: Cell<EquipmentItem, unknown>,
    filterColumn: string,
    groupColumn: string,
}) => {

    
    const column = useMemo(() => filterColumn, [filterColumn])

    const filterValue = table.getColumn(column)?.getFilterValue()
    const groupFilter = table.getColumn(groupColumn)?.getFilterValue()

    const typeFilter = useMemo(() => filterValue, [filterValue])
    const groupValue = useMemo(() => row.getValue(groupColumn) , [row, groupColumn])
    const typeValue = useMemo(() =>  cell.getValue(), [cell])

    return (
        <TableCell 
        key={cell.id}
        style={{
            width: cell.column.getSize(),
            minWidth: cell.column.columnDef.minSize
        }}
        >
        <Button 
            className={`hover:text-cyan-500 p-0 h-fit ${typeFilter === typeValue || groupFilter === groupValue ? 'text-cyan-500' : ''}`}
            onClick={() => {
                resetFilters(table)
                table.getColumn(column)?.setFilterValue(
                    typeFilter === typeValue ?
                    ""
                    :
                    typeValue
                )
            }}
        >
        {flexRender(
            cell.column.columnDef.cell,
            cell.getContext()
        )}
        </Button>
        </TableCell> 
    )
}