import { useState } from "react";
import { SummaryCard } from "./SummaryCard";
import { Summary } from "~/types/blog";


export const BlogSummaryList = ({
    summaries
}: {
    summaries: Summary[]
}) => {

    return (
        <div className="pt-4 pb-6 md:pb-10 flex flex-col w-full">
            {
                summaries.map((summary, idx) => 
                <div key={`blog-post-${idx}`} className={`flex justify-center w-full ${idx === 0 ? 'mb-3' : 'my-6'}`}>
                    <SummaryCard {...summary} postIdx={idx} />
                </div>
            )
            }
        </div>
    )
}