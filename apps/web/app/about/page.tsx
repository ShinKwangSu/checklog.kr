import type { Metadata } from 'next'

import { Section, SectionHeading } from '@/components/sections/section'
import { CtaBanner } from '@/components/sections/cta-banner'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: '회사소개',
  description: 'checklog는 현장 시설 운영을 더 쉽고 투명하게 만드는 서비스를 지향합니다.',
}

const values = [
  {
    title: '현장 중심',
    description:
      'QR 기반 현장 점검과 비로그인 민원 접수처럼, 실제 사용 흐름에서 마찰을 없애는 데 집중합니다.',
  },
  {
    title: '데이터 격리',
    description:
      '테넌트·워크스페이스 이중 격리로 각 고객의 데이터를 안전하게 분리해 관리합니다.',
  },
  {
    title: '단순함',
    description:
      '복잡한 설정 없이 바로 쓸 수 있는 제품을 지향합니다. 필요한 기능만, 명확하게 제공합니다.',
  },
]

export default function AboutPage() {
  return (
    <>
      <Section>
        <SectionHeading
          eyebrow="회사소개"
          title="시설 운영을 더 쉽게"
          description={siteConfig.description}
        />
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
          {values.map((value) => (
            <div key={value.title} className="rounded-lg border p-6">
              <h3 className="text-lg font-semibold">{value.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {value.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-lg border bg-muted/30 p-6 text-sm text-muted-foreground">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-foreground">회사명</dt>
              <dd>{siteConfig.company.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">이메일</dt>
              <dd>{siteConfig.company.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">연락처</dt>
              <dd>{siteConfig.company.tel}</dd>
            </div>
            <div>
              <dt className="font-semibold text-foreground">주소</dt>
              <dd>{siteConfig.company.address}</dd>
            </div>
          </dl>
        </div>
      </Section>

      <CtaBanner />
    </>
  )
}
