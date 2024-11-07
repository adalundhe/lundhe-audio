import { Avatar, AvatarImage } from "~/components/ui/avatar"
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "~/components/ui/accordion"
import { AspectRatio } from "~/components/ui/aspect-ratio"

const StudioContentHeader = ({
    imagePath,
    imageAltTxt,
    title,
    headerAlignment
}: {
    imagePath: string,
    imageAltTxt: string,
    title: string,
    headerAlignment: "left" | "right"
}) => headerAlignment === "left" ? <AccordionTrigger 
        className="w-full flex items-center justify-start cursor-default"
        chevronSide={headerAlignment}
    >
    <Avatar className="w-[60px] h-[60px] rounded-full mr-2">
        <AvatarImage src={imagePath} alt={imageAltTxt} />
    </Avatar>
    <h1 className="text-md font-semibold text-left break-words w-fit">{title}</h1>
</AccordionTrigger> : <AccordionTrigger 
    className="w-full flex items-center justify-end cursor-default"
    chevronSide={headerAlignment}
>
    <h1 className="text-md font-semibold text-right break-words w-fit">{title}</h1>
    <Avatar className="w-[60px] h-[60px] rounded-full ml-2">
        <AvatarImage src={imagePath} alt={imageAltTxt} />
    </Avatar>
</AccordionTrigger>


export const StudioContentSection = ({
    imagePath,
    imageAltTxt,
    title,
    children,
    headerAlignment
}: {
    imagePath: string,
    imageAltTxt: string,
    title: string,
    children: JSX.Element[]
    headerAlignment: "left" | "right"
}) => {
    return (
        <AccordionItem value={title.toLowerCase()} className="flex flex-col w-full">
            <StudioContentHeader 
                imagePath={imagePath}
                imageAltTxt={imageAltTxt}
                title={title}
                headerAlignment={headerAlignment}
            />
            <AccordionContent className="w-full my-4">
            {...children}
            </AccordionContent> 
        </AccordionItem>
    )
}