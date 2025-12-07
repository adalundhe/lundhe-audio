"use client"
import { type JSX } from "react"

export const BlogSplitCard = ({
    left,
    right,
}: {
    left: string | JSX.Element | JSX.Element[],
    right: string | JSX.Element | JSX.Element[]
}) => (
    <div className='flex flex-row gap-4 items-center mb-4'>
        <div className="self-center w-1/2">
            {left}
        </div>
        <div className="self-center w-1/2">
            {right}
        </div>
    </div>
)