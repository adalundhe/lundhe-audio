
import { Separator } from "~/components/ui/separator"
import { Avatar, AvatarImage } from "~/components/ui/avatar"


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
}) => headerAlignment === "left" ? <div className="w-full flex items-center justify-start">
    <Avatar className="w-[80px] h-[80px] rounded-full">
        <AvatarImage src={imagePath} alt={imageAltTxt} />
        </Avatar>
    <h1 className="text-md font-semibold ml-2">{title}</h1>
</div> : <div className="w-full flex items-center justify-end">
    <h1 className="text-md font-semibold mr-2">{title}</h1>
    <Avatar className="w-[80px] h-[80px] rounded-full">
        <AvatarImage src={imagePath} alt={imageAltTxt} />
    </Avatar>
</div>


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
        <>
        <div className="w-full flex justify-center">   
            <Separator className="w-3/4 my-8"/>
        </div>
        <div className="w-2/3 flex flex-col justify-center">
            <StudioContentHeader 
                imagePath={imagePath}
                imageAltTxt={imageAltTxt}
                title={title}
                headerAlignment={headerAlignment}
            />
            <div className="w-full my-8">
            {...children}
            </div> 
        </div>
        </>
    )
}