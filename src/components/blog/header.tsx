import Link from "next/link";

export const Header = ({
    text,
    description,
    section,
    side = 'left'
}: {
    text: string,
    description?: string,
    section: string,
    side: 'left' | 'right'
}) => <div className="min-w-full flex flex-col justify-center items-center mb-8">
    <div className="max-w-[75%] w-full flex flex-col">
        <p className={`text-[1.5vmax] w-1/2 ${side === 'left' ? 'self-start text-left' : 'self-end text-right'}`}>{
            
            <Link href={`#${section}`} className="hover:underline">
                {text}
            </Link>
        }</p>
        <div className={`w-1/2 border-b my-2 ${side === 'left' ? 'self-start' : 'self-end'}`}></div>
        {
            description ?
            <p className={`text-[0.75vmax] text-slate-700/75 dark:text-slate-100/50 ${side === 'left' ? 'self-start' : 'self-end'}`}>
                {description}
            </p> :  null
        }
    </div>
</div>
