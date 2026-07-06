export type PricingPlan = {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  /** CTA 라벨 */
  cta: string
  /** 강조(추천) 플랜 여부 */
  featured?: boolean
}

/** 요금제 — 실제 금액 확정 전 MVP 예시값. 문구는 추후 조정 */
export const pricingPlans: PricingPlan[] = [
  {
    name: 'Free',
    price: '₩0',
    period: '/월',
    description: '소규모로 시작하는 팀을 위한 무료 플랜',
    features: [
      '워크스페이스 1개',
      '시설 최대 30개',
      '점검표 · 점검자 관리',
      'QR 현장 점검',
    ],
    cta: '무료로 시작하기',
  },
  {
    name: 'Pro',
    price: '₩39,000',
    period: '/월',
    description: '여러 건물을 운영하는 팀을 위한 표준 플랜',
    features: [
      '워크스페이스 무제한',
      '시설 무제한',
      '민원 접수 · 처리 관리',
      '점검 이력 리포트',
      '우선 이메일 지원',
    ],
    cta: '무료로 시작하기',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: '별도 문의',
    description: '대규모 운영과 맞춤 요구가 있는 조직을 위한 플랜',
    features: [
      'Pro의 모든 기능',
      '전용 온보딩 · 교육',
      'SLA 및 전담 지원',
      '맞춤 기능 협의',
    ],
    cta: '도입 문의하기',
  },
]
