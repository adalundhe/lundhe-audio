import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react';


export type ContentsListing = {
    text: string;
    slug: string;
    subsections?: Omit<ContentsListing, "subsections">[]
}


export const ContentsItem = ({
    text,
    slug,
}: {
    text: string,
    slug: string,
}) => {

    const [isHovered, setIsHovered] = useState(false);

    const onMouseEnter = () => {
        setIsHovered(true);
    };
    const onMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <div
            className='flex gap-4 w-full h-[1.5vmax] my-2 items-center'
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <Link 
                href={`#${slug}`}
                className="text-slate-500/90 hover:text-cyan-500"
            >- {
                text
            }</Link>
            {
                isHovered
                ?  
                <div className='w-[1vmax] h-[1vmax]'>
                    <ArrowRight className='text-cyan-500'/>
                </div>
                : null
            }
        </div>
    )
}