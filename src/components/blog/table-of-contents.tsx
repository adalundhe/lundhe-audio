import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Separator } from '~/components/ui/separator'
import { useState } from 'react';
import { type ContentsListing, ContentsItem } from './contents-item'

export const TableOfContents = ({
    contents
}: {
    contents: ContentsListing[]
}) => {



    return (
        <div className='mt-4 mb-4'>
            <h1 className='text-[2vmax]'>Contents</h1>
            <ul className='mb-4'>
                {
                    contents.map((item, idx) => (
                        <li
                            key={`${item.slug}-${idx}`}
                            className='flex flex-col' 
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
            </ul>
            <div className='mt-4 mb-4'>
                <Separator/>
            </div>
        </div>
    )


} 