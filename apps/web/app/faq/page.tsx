import type { Metadata } from 'next'

import { Section, SectionHeading } from '@/components/sections/section'
import { FaqAccordion } from '@/components/sections/faq-accordion'
import { CtaBanner } from '@/components/sections/cta-banner'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'checklog 서비스에 대해 자주 묻는 질문과 답변을 모았습니다.',
}

export default function FaqPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="FAQ"
          title="자주 묻는 질문"
          description="궁금한 점이 해결되지 않았다면 도입문의로 남겨 주세요."
        />
        <div className="mt-12">
          <FaqAccordion />
        </div>
      </Section>

      <CtaBanner />
    </>
  )
}
