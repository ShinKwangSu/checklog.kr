'use client'

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@spotcare/ui/components/accordion'

import { faqItems } from '@/content/faq'

export function FaqAccordion() {
  return (
    <Accordion type="single" collapsible className="mx-auto w-full max-w-2xl">
      {faqItems.map((item, index) => (
        <AccordionItem key={item.q} value={`item-${index}`}>
          <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
