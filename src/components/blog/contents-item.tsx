import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Separator } from '~/components/ui/separator'
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
            className='flex gap-4'
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
                isHovered ? <ArrowRight className='text-[1.5vmax] text-cyan-500'/> : null
            }
        </div>
    )
}