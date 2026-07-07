import type { Metadata } from 'next'

import { Section, SectionHeading } from '@/components/sections/section'
import { FeatureGrid } from '@/components/sections/feature-grid'
import { CtaBanner } from '@/components/sections/cta-banner'

export const metadata: Metadata = {
  title: '기능소개',
  description: '워크스페이스, 시설 관리, 점검, 민원까지 checklog의 핵심 기능을 소개합니다.',
}

export default function FeaturesPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="기능소개"
          title="시설 운영을 위한 완결된 기능"
          description="STEP by STEP으로 구축한 시설 관리의 핵심 흐름을 확인하세요."
        />
        <div className="mt-12">
          <FeatureGrid detailed />
        </div>
      </Section>

      <CtaBanner />
    </>
  )
}
