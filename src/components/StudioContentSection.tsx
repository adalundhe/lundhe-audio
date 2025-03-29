import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "~/components/ui/accordion";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Avatar, AvatarImage } from "~/components/ui/avatar";


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
    <Avatar className="w-[100px] h-[100px] rounded-full mr-4">
    <AspectRatio ratio={4 / 3} className="flex items-center justify-center">
        <AvatarImage src={imagePath} alt={imageAltTxt} className="w-full h-full" />
    </AspectRatio>
       
    </Avatar>
    <h1 className="text-xl font-light font-semibold text-left break-words w-fit">{title}</h1>
</AccordionTrigger> : <AccordionTrigger 
    className="w-full flex items-center justify-end cursor-default"
    chevronSide={headerAlignment}
>
    <h1 className="text-xl font-light font-semibold text-right break-words w-fit">{title}</h1>
    <Avatar className="w-[100px] h-[100px] rounded-full ml-4">
        <AspectRatio ratio={4 / 3} className="flex items-center justify-center">
            <AvatarImage src={imagePath} alt={imageAltTxt} />
        </AspectRatio>
            
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
            <AccordionContent className="w-full my-4 text-xl font-thin">
            {...children}
            </AccordionContent> 
        </AccordionItem>
    )
}