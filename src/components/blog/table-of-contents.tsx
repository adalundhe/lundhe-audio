import { type ContentsListing, ContentsItem } from './contents-item'
 
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion"
import { Courier_Prime } from 'next/font/google';

const courierPrime = Courier_Prime({
  weight: "400",
  subsets: ['latin']
})
 


export const TableOfContents = ({
    contents
}: {
    contents: ContentsListing[]
}) => {

    return (
        <div className='md:w-1/2 w-full mb-4 md:mt-4'>
            <Accordion type="single" collapsible>
                <AccordionItem value='contents'>
                    <AccordionTrigger 
                        className='flex gap-4 no-underline hover:no-underline md:mb-4'
                        value={'contents'} chevronSide='left'
                    >
                         <h1 className='text-[2.5vmax] text-slate-500/90 hover:text-cyan-500'>Contents</h1>
                    </AccordionTrigger>
                    <AccordionContent className={`${courierPrime.className}`}>
                            {
                        contents.map((item, idx) => (
                            <li
                                key={`${item.slug}-${idx}`}
                                className='flex flex-col justify-center'
                                value={item.slug} 
                            >
                                <ContentsItem 
                                    text={item.text}
                                    slug={item.slug}
                                />
                                <ul>
                                {
                                    item.subsections ? item.subsections.map((subitem, idx) => (
                                        <li
                                            key={`${subitem.slug}-${idx}`}
                                            className='flex pl-4'
                                        >
                                        <ContentsItem
                                            text={subitem.text}
                                            slug={subitem.slug}
                                        />
                                        </li>
                                    )) : null
                                }
                                </ul>
                            </li>
                        ))
                    }
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )


} 