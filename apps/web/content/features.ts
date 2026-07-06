import {
  Building2,
  LayoutGrid,
  ClipboardCheck,
  MessageSquareWarning,
  QrCode,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export type Feature = {
  icon: LucideIcon
  title: string
  description: string
  /** 기능소개 페이지 상세 불릿 */
  points: string[]
}

/** STEP1~3 기획안 기반 핵심 기능 */
export const features: Feature[] = [
  {
    icon: Building2,
    title: '멀티테넌트 워크스페이스',
    description:
      '업체 하나가 여러 건물·장소를 독립 워크스페이스로 관리합니다. 데이터는 워크스페이스 단위로 완전히 격리됩니다.',
    points: [
      '건물/장소별 워크스페이스 분리',
      '지상·지하 층수 정의 후 3F·B1 형태로 자동 치환 표시',
      '타 워크스페이스와 데이터 미공유(테넌트 격리)',
    ],
  },
  {
    icon: LayoutGrid,
    title: '시설 타입 · 시설 정보 관리',
    description:
      '화장실·회의실 등 공간 카테고리를 자유롭게 정의하고, 시설 정보를 층·타입과 연결해 등록합니다.',
    points: [
      '워크스페이스별 시설 타입 CRUD',
      '시설명·층수·타입·위치설명·비고 등록',
      '층수 정수 저장으로 정렬·필터를 쿼리만으로 지원',
    ],
  },
  {
    icon: ClipboardCheck,
    title: '점검표 · 점검자 관리',
    description:
      '반복 주기가 있는 점검표 템플릿과 현장 점검자를 워크스페이스 단위로 운영합니다.',
    points: [
      '매일·매주·매월 반복 주기와 점검 항목 구성',
      '점검자(담당자) 정보 관리',
      '시설-점검표 다대다 연결',
    ],
  },
  {
    icon: QrCode,
    title: 'QR 현장 점검',
    description:
      '시설에 부착된 QR을 스캔해 별도 로그인 없이 현장에서 바로 점검을 수행합니다.',
    points: [
      '시설별 QR 코드 발급',
      '비로그인 현장 접근',
      '점검 이력 자동 누적(오늘·이번주·이번달)',
    ],
  },
  {
    icon: MessageSquareWarning,
    title: '민원 접수 · 처리',
    description:
      '방문자가 QR로 불편사항을 접수하고, 관리자는 시설별로 민원을 확인·처리합니다.',
    points: [
      '비로그인 방문자 민원 접수(사진 첨부)',
      '시설별 민원 이력 확인',
      '접수 → 처리중 → 완료 상태 관리',
    ],
  },
  {
    icon: ShieldCheck,
    title: '데이터 격리 · 보안',
    description:
      '테넌트·워크스페이스 이중 격리와 인증 기반 접근 제어로 각 업체의 데이터를 안전하게 보호합니다.',
    points: [
      '테넌트 + 워크스페이스 이중 격리',
      '인증 기반 접근 제어',
      '삭제 데이터 보존(소프트 딜리트)',
    ],
  },
]
