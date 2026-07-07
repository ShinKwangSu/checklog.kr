/**
 * 랜딩 Services 섹션 — 핵심 서비스 3가지 + 각각의 효과 수치.
 * 상세 6기능은 content/features.ts(/features 페이지)에 별도.
 * ⚠️ 수치는 출시 전 예시값(가설). 베타 결과로 검증 후 확정한다.
 */
import { QrCode, LayoutDashboard, MessageSquareWarning, type LucideIcon } from 'lucide-react'

export type Outcome = {
  icon: LucideIcon
  title: string
  description: string
  /** 강조 효과 수치 */
  metric: string
  metricLabel: string
}

export const outcomes: Outcome[] = [
  {
    icon: QrCode,
    title: 'QR 점검으로 종이 점검표 대체',
    description:
      '시설에 붙은 QR을 스캔하면 점검자·시각·항목이 그 자리에서 디지털로 기록됩니다. 매일·매주·매월 반복하던 점검표를 그대로 옮겨오고, 이력은 그대로 남습니다.',
    metric: '반나절 → 즉시',
    metricLabel: '월말 이력 취합 시간',
  },
  {
    icon: LayoutDashboard,
    title: '현장 대시보드로 한눈에',
    description:
      '오늘·이번 주·이번 달 점검 현황이 현장별로 자동 집계됩니다. 확인 전화 대신 화면 한 번으로 모든 현장의 진행 상황을 파악합니다.',
    metric: '전화 0통',
    metricLabel: '현황 파악에 드는 통화',
  },
  {
    icon: MessageSquareWarning,
    title: 'QR 민원 접수로 누락 차단',
    description:
      '방문자가 로그인 없이 QR로 사진과 함께 민원을 남기고, 접수 → 처리중 → 완료까지 상태로 추적됩니다. 구두 민원이 사라지니 놓치는 건도 사라집니다.',
    metric: '누락 0건',
    metricLabel: '처리 이력 100% 기록',
  },
]
