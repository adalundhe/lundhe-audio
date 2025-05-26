import { Book, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Card } from '~/components/ui/card'


export const BlogNavCard = ({
    title,
    link,
    description,
    date,
}: {
    title: string
    link: string
    description: string
    date: string
}) => {


        const [isHovered, setIsHovered] = useState(false);
    
        const onMouseEnter = () => {
            setIsHovered(true);
        };
        const onMouseLeave = () => {
            setIsHovered(false);
        };
    

    return (
        <Link href={`/blog/${link}`} className="cursor-pointer">
            <Card className="w-full h-full rounded-none border shadow-none transition-all motion-reduce:transition-none duration-700 hover:scale-110 motion-reduce:hover:scale-100"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <div className='py-8 px-8 w-full grid grid-rows-2'>
                    <div className='row-span-1 grid grid-cols-8'>

                        <h1 className='col-span-2 flex items-center text-2xl'>{title}</h1>
                        <div className='col-span-6'>
                            <div className={`w-full text-xl flex justify-end items-center space-x-2 ${isHovered ? 'hover:text-black dark:hover:text-neutral-100' : 'text-slate-900/80 dark:text-neutral-100/80'}`}>
                                <p className={isHovered ? 'underline': ''}>
                                    read
                                </p>
                                {
                                    isHovered ? <BookOpen/> : <Book/>
                                }
                            </div>
                        </div>
                    </div>
                    <div className='row-span-1 grid grid-cols-8'>
                        <p className='col-span-6 flex items-center'>{description}</p>
                        <p className='col-span-2 flex justify-end text-md text-slate-900/50 dark:text-neutral-100/50'>{date}</p>
                    </div>
                </div>
            </Card>
        </Link>
    )
}