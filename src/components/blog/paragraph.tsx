import { type JSX } from "react";

export const Paragraph = ({
    children,
    styles,
    side = 'left',
    align = 'justify'
}: {
    children: string | JSX.Element | JSX.Element[],
    styles?: string,
    side: 'left' | 'center' | 'right'
    align: 'left' | 'center' | 'right' | 'justify'
}) => <div className={`text-[1.5vmax] mb-4 h-full paragraph-text ${
        align === 'left' ? 'text-left' :  
        align === 'center' ? 'text-center' : 
        align === 'justify' ? 'text-justify' : 'text-right'
    } ${
        side === 'left' ? 'self-start' :
        side === 'center' ? 'self-center' :
        'self-end'
    } ${styles ?? ""}`}>
    {children}
</div>