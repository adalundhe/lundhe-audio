import { type JSX } from "react";

export const Content = ({
    children,
    side = 'left'
}: {
    children: string | JSX.Element | JSX.Element[],
    side: 'left' | 'right'
}) => <div className="min-w-full flex flex-col justify-center items-center mb-4">
    <div className={`max-w-[75%] w-full flex flex-col ${side === 'left' ? 'items-start' : 'items-end'}`}>
        {children}
    </div>
</div>