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
    side = 'left',
}: {
    title: string,
    group: string,
    children: ReactNode
    side?: 'left' | 'right'
}) => {
    return (
        <Accordion type="single" collapsible className={`flex flex-col w-full ${side === 'left' ? 'self-start' : 'self-end'}`}>
            <AccordionItem value={group} key={`service-section-${group}`}>
                <AccordionTrigger chevronSide={side} className="text-2xl">
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