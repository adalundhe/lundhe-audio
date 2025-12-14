"use client"
import { Book, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Card } from '~/components/ui/card'
import { BlogTag } from './blog-tag'
import { Button } from '~/components/ui/button'

export const BlogNavCard = ({
    title,
    link,
    description,
    date,
    tags,
}: {
    title: string
    link: string
    description: string
    date: string,
    tags: string[],
}) => {


    const [isHovered, setIsHovered] = useState(false);

    const onMouseEnter = () => {
        setIsHovered(true);
    };
    const onMouseLeave = () => {
        setIsHovered(false);
    };

    const titleSlug = useMemo(() => title.toLocaleLowerCase().replace(' ', '_'), [title])
    

    return (
            <Card className="bg-(--background) w-full h-full rounded-none border shadow-none md:transition-all motion-reduce:transition-none md:duration-700 md:hover:scale-110 motion-reduce:hover:scale-100"
            >
                <div className='py-4 px-4 w-full flex flex-col gap-4'>
                    <div className='lg:grid lg:grid-cols-8 flex flex-col gap-2'>

                        <h1 className='col-span-6 text-2xl w-full'>{title}</h1>
                        <div className='col-span-2 flex items-start lg:justify-end w-full'>
                            <Button
                                className={`w-fit flex justify-end items-center border rounded-sm hover:border-cyan-500 hover:text-cyan-500`}
                                onMouseEnter={onMouseEnter}
                                onMouseLeave={onMouseLeave}
                            >

                                <Link href={`/blog/${link}`} className="cursor-pointer flex space-x-2">
                                    <p className='text-sm'>
                                        read
                                    </p>
                                    <span>
                                    {
                                        isHovered ? <BookOpen className='!w-[16px] !h-[16px]'/> : <Book className='!w-[16px] !h-[16px]'/>
                                    }
                                    </span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className='lg:grid lg:grid-cols-8 flex flex-col gap-2'>
                        <p className='col-span-6 flex items-start justify-start text-sm'>{description}</p>
                        <p className='col-span-2 w-full lg:text-right text-xs text-muted-foreground'>{date}</p>
                    </div>
                    <div className='flex gap-4 md:justify-start items-center justify-center'>
                        {
                            tags.map((tag, idx) => (
                                <div key={`${titleSlug}-${tag}-${idx}`}>
                                    <BlogTag tag={tag} />
                                </div>
                            ))
                        }
                    </div>
                </div>
            </Card>
    )
}