import { Book, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Card } from '~/components/ui/card'
import { BlogTag } from './blog-tag'

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
            <Card className="bg-(--background) w-full h-full rounded-none border shadow-none transition-all motion-reduce:transition-none duration-700 hover:scale-110 motion-reduce:hover:scale-100"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <div className='py-8 px-2 w-full flex flex-col'>
                    <div className='grid grid-cols-8'>

                        <h1 className='col-span-6 flex items-start text-2xl w-full'>{title}</h1>
                        <div className='col-span-2 flex items-start justify-end w-full'>
                            <div className={`w-fit flex justify-end items-center space-x-2 ${isHovered ? 'hover:text-cyan-500' : 'text-slate-900/80 dark:text-neutral-100/80'}`}>

                                <Link href={`/blog/${link}`} className="cursor-pointer">
                                    <p className='lg:text-[1.5vmax] md:text-[2vmax] text-[2.5vmax]'>
                                        read
                                    </p>
                                </Link>
                                <div className='w-full'>
                                {
                                    isHovered ? <BookOpen className='md:h-[1.5vmax] md:w-[1.5vmax] h-[2vmax] w-[2vmax]'/> : <Book className='md:h-[2vmax] md:w-[2vmax] h-[2vmax] w-[2vmax]'/>
                                }
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='grid grid-cols-8'>
                        <p className='col-span-6 flex items-start justify-start text-[1.5vmax]'>{description}</p>
                        <p className='col-span-2 flex justify-end items-start text-md text-slate-900/50 dark:text-neutral-100/50'>{date}</p>
                    </div>
                    <div className='flex my-4 gap-4 w-full md:justify-start items-center justify-center'>
                        {
                            tags.map((tag, idx) => (
                                <div key={`${titleSlug}-${tag}-${idx}`} className='items-center justify-center'>
                                    <BlogTag tag={tag} />
                                </div>
                            ))
                        }
                    </div>
                </div>
            </Card>
    )
}