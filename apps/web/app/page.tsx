import { Hero } from '@/components/sections/hero'
import { Section, SectionHeading } from '@/components/sections/section'
import { FeatureGrid } from '@/components/sections/feature-grid'
import { PricingCards } from '@/components/sections/pricing-cards'
import { CtaBanner } from '@/components/sections/cta-banner'

export default function HomePage() {
  return (
    <>
      <Hero />

      <Section>
        <SectionHeading
          eyebrow="핵심 기능"
          title="현장 운영에 필요한 모든 것"
          description="워크스페이스 단위로 시설·점검·민원을 한 번에 관리하세요."
        />
        <div className="mt-12">
          <FeatureGrid />
        </div>
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow="요금"
          title="합리적인 요금제"
          description="무료로 시작하고 필요할 때 확장하세요."
        />
        <div className="mt-12">
          <PricingCards />
        </div>
      </Section>

      <CtaBanner />
    </>
  )
}
