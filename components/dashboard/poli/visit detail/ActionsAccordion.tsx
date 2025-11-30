"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface ActionsAccordionProps {
  title: string
  children: React.ReactNode
}

export default function ActionsAccordion({ title, children }: ActionsAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-gray-800 text-sm">
          {title}
        </AccordionTrigger>
        <AccordionContent className="text-sm text-gray-600">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
