"use client"
import { useMemo, type JSX } from "react";
import {Top} from '~/components/blog/top'
import {Content} from '~/components/blog/content'
import {Header} from '~/components/blog/header'
import {Separator} from '~/components/ui/separator'
import {Subsection} from '~/components/blog/subsection'


export const BlogSection = ({
    title,
    description,
    section,
    children,
    contentStyles,
    type,
    position,
    separatorWidth,
}: {
    title: string,
    description: string,
    section: string,
    children: string | JSX.Element | JSX.Element[]
    position?: 'left' | 'right'
    type?: 'main' | 'subsection'
    separatorWidth?: string
    contentStyles?: string
}) => {

    const styles = useMemo(() => contentStyles, [contentStyles])
    const contentSide = useMemo(() => position ?? 'left', [position])
    const sectionType = useMemo(() => type ?? 'main', [type])
    const sepWidth = useMemo(() => separatorWidth ?? (sectionType === 'main' ? 'w-full' : 'w-3/4'), [separatorWidth, sectionType])

    return (
        sectionType === 'main' ?
        <>
            <div className='flex items-center justify-center w-full'>
                <Separator className={`w-${sepWidth}`}/>
            </div>
            <Top/>
            <Header
                text={title}
                description={description}
                section={section}
                side={contentSide}
            />
            <Content side={contentSide} styles={styles ?? ''}>
                {children}
            </Content>
        </> :
        <>
            <div className='flex items-center justify-center w-full'>
                <Separator className={sepWidth}/>
            </div>
            <Top/>
            <Subsection
                text={title}
                description={description}
                section={section}
                side={contentSide}
            />
            <Content side={contentSide} styles={`gap-4 ${styles ?? ''}`}>
                {children}
            </Content>
        </>
    )
}