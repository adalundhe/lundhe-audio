import Link from "next/link";
import { useMemo, type JSX } from "react";


export const BlogLink = ({
    children,
    to,
    styles,
    linkType = 'external'
}: {
    children: string | JSX.Element | JSX.Element[],
    to: string,
    styles?: string,
    linkType?: 'external' | 'internal'
}) => {

    const blogLinkType = useMemo(() => linkType, [linkType])

    return (
        blogLinkType === 'external' ?
        <a target="_blank" rel="noopener noreferrer" className={`hover:underline  ${styles ?? ""} text-cyan-500`} href={to}>{children}</a>
        :
        <Link href={to} className={`hover:underline  ${styles ?? ""} text-cyan-500`}>{children}</Link>
    )

}