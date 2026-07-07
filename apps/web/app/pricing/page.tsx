import type { Metadata } from 'next'

import { Section, SectionHeading } from '@/components/sections/section'
import { PricingCards } from '@/components/sections/pricing-cards'
import { FaqAccordion } from '@/components/sections/faq-accordion'

export const metadata: Metadata = {
  title: '요금안내',
  description: '무료 플랜부터 Enterprise까지, checklog의 요금제를 안내합니다.',
}

export default function PricingPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="요금안내"
          title="필요한 만큼만, 합리적으로"
          description="무료로 시작해 규모에 맞춰 확장하세요. 모든 플랜은 언제든 변경할 수 있습니다."
        />
        <div className="mt-12">
          <PricingCards />
        </div>
      </Section>

      <Section muted>
        <SectionHeading title="자주 묻는 질문" />
        <div className="mt-12">
          <FaqAccordion />
        </div>
      </Section>
    </>
  )
}
