import { type JSX } from "react";
import {ScrollToTop} from '~/components/ui/scroll-to-top'

export const Content = ({
    children,
    styles,
    side = 'left'
}: {
    children: string | JSX.Element | JSX.Element[],
    styles: string,
    side: 'left' | 'right'
}) => <div className="min-w-full max-w-full flex flex-col justify-center items-center mb-4">
    <div className={`max-w-[75%] w-full flex flex-col ${side === 'left' ? 'items-start' : 'items-end'} ${styles ? styles : ''}`}>
        {children}
    </div>
</div>