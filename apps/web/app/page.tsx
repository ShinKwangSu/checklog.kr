import { Hero } from '@/components/sections/hero'
import { Section, SectionHeading } from '@/components/sections/section'
import { ProblemList } from '@/components/sections/problem-list'
import { ServiceOutcomes } from '@/components/sections/service-outcomes'
import { FeatureGrid } from '@/components/sections/feature-grid'
import { PricingCards } from '@/components/sections/pricing-cards'
import { FaqAccordion } from '@/components/sections/faq-accordion'
import { ContactForm } from '@/components/sections/contact-form'
import { CtaBanner } from '@/components/sections/cta-banner'

export default function HomePage() {
  return (
    <>
      <Hero />

      <Section id="problem" muted>
        <SectionHeading
          eyebrow="현장의 고민"
          title="아직도 이렇게 관리하고 계신가요?"
          description="현장에서 매일 반복되는 3가지 문제입니다."
        />
        <div className="mt-12">
          <ProblemList />
        </div>
      </Section>

      <Section id="outcomes">
        <SectionHeading
          eyebrow="이렇게 달라집니다"
          title="설치도 로그인도 없이, 스캔 한 번으로"
          description="종이 점검표를 QR로 바꾸고, 여러 현장을 한 곳에서 관리하세요."
        />
        <div className="mt-12">
          <ServiceOutcomes />
        </div>
      </Section>

      <Section id="features" muted>
        <SectionHeading
          eyebrow="기능소개"
          title="현장 운영에 필요한 모든 것"
          description="STEP by STEP으로 구축한 시설 관리의 핵심 흐름을 확인하세요."
        />
        <div className="mt-12">
          <FeatureGrid detailed />
        </div>
      </Section>

      <Section id="pricing">
        <SectionHeading
          eyebrow="요금안내"
          title="필요한 만큼만, 합리적으로"
          description="무료로 시작해 규모에 맞춰 확장하세요. 모든 플랜은 언제든 변경할 수 있습니다."
        />
        <div className="mt-12">
          <PricingCards />
        </div>
      </Section>

      <Section id="faq" muted>
        <SectionHeading
          eyebrow="FAQ"
          title="자주 묻는 질문"
          description="궁금한 점이 해결되지 않았다면 아래 도입문의로 남겨 주세요."
        />
        <div className="mt-12">
          <FaqAccordion />
        </div>
      </Section>

      <Section id="contact">
        <SectionHeading
          eyebrow="도입문의"
          title="도입을 검토하고 계신가요?"
          description="아래 폼을 작성해 주시면 담당자가 확인 후 연락드립니다."
        />
        <ContactForm />
      </Section>

      <CtaBanner />
    </>
  )
}
