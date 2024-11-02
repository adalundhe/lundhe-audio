import { useCallback, useState } from "react";
import { SummaryTag } from "./SummaryTag";
import { Summary } from "~/types/blog";

import Link from "next/link";



export const SummaryCard = ({
    date,
    summary,
    title,
    tags,
    postIdx,
    slug
}: Summary & {postIdx: number}) => {

    const mode = "light"

    const [hovering, setHovering] = useState(false)

    return (
        <div></div>
    )
}