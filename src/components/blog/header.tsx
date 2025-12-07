"use client"
import Link from "next/link";

export const Header = ({
    text,
    description,
    section,
    side = 'left'
}: {
    text: string,
    description?: string,
    section: string,
    side: 'left' | 'right'
}) => <div className="min-w-full flex flex-col justify-center items-center mb-4">
    <div className="max-w-[75%] w-full flex flex-col">
        <p className={`text-[3vmax] w-full ${side === 'left' ? 'text-left' : 'text-right'}`} id={section}>{
            
            <Link href={`#${section}`} className="hover:underline text-cyan-500">
                {text}
            </Link>
        }</p>
        <div className={`w-1/2 border-b my-2 ${side === 'left' ? 'self-start' : 'self-end'}`}></div>
        {
            description ?
            <p className={`text-[1.25vmax] text-slate-700/75 dark:text-slate-100/50 ${side === 'left' ? 'text-left' : 'text-right'}`}>
                {description}
            </p> :  null
        }
    </div>
</div>
