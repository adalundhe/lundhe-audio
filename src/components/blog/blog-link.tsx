import { type JSX } from "react";


export const BlogLink = ({
    children,
    to,
    styles,
}: {
    children: JSX.Element | JSX.Element[],
    to: string,
    styles?: string
}) => <a target="_blank" rel="noopener noreferrer" className={`hover:underline  ${styles ? styles : ""} text-cyan-500`} href={to}>{children}</a>