import {Paragraph} from '~/components/blog/paragraph'
import {Frame} from '~/components/blog/frame'
import {BlogLink} from '~/components/blog/blog-link'
import { type JSX, useMemo } from 'react'


type ImageProps = {
    src: string
    alt: string
    size?: number
    side?: 'left' | 'center' | 'right'
    styles?: string
    subtext: string
}

type MemoizedImageProps = {
    src: string
    alt: string
    size: number
    side: 'left' | 'center' | 'right'
    styles?: string
    subtext: string
}

type Styles = {
    title?: string
}

export const BlogSubsectionCard = ({
    title,
    slug,
    children,
    image,
    position,
    styles,
}: {
    title: string,
    slug: string,
    children: string | JSX.Element | JSX.Element[]
    image?: ImageProps,
    position?: 'left' | 'center' | 'right',
    styles?: Styles
}) => {

    const subsectionPosition = useMemo(() => position ?? 'left', [position])
    const imageProps = useMemo(() => {
        
        if (image === undefined || image === null) {
            return image
        }

        return ({
            src: image.src,
            alt: image.alt,
            side: image.side ?? 'center',
            size: image.size ?? 50,
            styles: image.styles,
            subtext: image.subtext,
        }) as MemoizedImageProps

    }, [image])

    const styleOpts = useMemo(() => styles, [styles])


    return (
        <div className='mt-4 mb-4 w-full' id={slug}>
            <Paragraph styles="w-full self-start text-tighter flex flex-col gap-4" align='justify' side={subsectionPosition}>
                <div className={`mb-4 self-center w-3/4 ${ styleOpts?.title ?? ''}`}>
                    <BlogLink to={`#${slug}`} styles='text-[2vmax]' linkType='internal'>
                        <b className='hover:underline'>{title}</b>
                    </BlogLink>
                </div>
                {
                    imageProps ?
                    <Frame
                        {...imageProps}
                    />
                    : <></>
                }
                <div className='self-center w-3/4 flex flex-col gap-4'>
                   {children}
                </div>
            </Paragraph>
        </div>
    )
}