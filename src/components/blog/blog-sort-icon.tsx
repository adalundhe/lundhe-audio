import { ArrowDownAZ, ArrowUpAZ, ArrowUpNarrowWide, ArrowDownNarrowWide } from "lucide-react";
import { type SortField, type SortDirection } from "~/stores/posts-store";


export const BlogSortIcon = ({
    direction,
    field,
    styles
}: {
    direction: SortDirection,
    field: SortField,
    styles?: string
}) => (
    field === 'date'
    ?
    ( direction === 'ASC' ? <ArrowUpNarrowWide className={styles}/> : <ArrowDownNarrowWide className={styles}/> )
    :
    (direction === 'ASC' ? <ArrowUpAZ className={styles}/> : <ArrowDownAZ className={styles}/>)
)