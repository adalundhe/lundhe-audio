import { ReactNode } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion"
import { Separator } from "~/components/ui/separator"



export const ServicesSection = ({
    title,
    children,
    group,
    chevronSide = 'left',
}: {
    title: string,
    group: string,
    children: ReactNode
    chevronSide?: 'left' | 'right'
}) => {
    return (
        <Accordion type="single" collapsible className="flex flex-col w-1/2">
            <AccordionItem value={group} key={`service-section-${group}`}>
                <AccordionTrigger chevronSide={chevronSide} className="text-2xl">
                    {title}
                </AccordionTrigger>
                <AccordionContent className="p-0">
                    <Separator className="w-full mb-2"/>
                    {children}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
} 