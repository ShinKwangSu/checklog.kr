/**
 * 랜딩 Problem 섹션 — 고객이 현장에서 겪는 구체적 문제.
 * ⚠️ 수치는 출시 전 예시값(가설). 베타 결과로 검증 후 확정한다. (pricing.ts와 동일 정책)
 */

export type Problem = {
  /** 강조 수치 */
  stat: string
  /** 수치 설명 라벨 */
  statLabel: string
  title: string
  description: string
}

export const problems: Problem[] = [
  {
    stat: '반나절',
    statLabel: '월말 기록 취합에 걸리는 시간',
    title: '점검 기록이 사라집니다',
    description:
      '종이·엑셀·카톡에 흩어진 기록. 월말이면 현장별 기록을 모으는 데만 반나절이 걸리고, "그날 점검했나요?"에 답할 근거가 남지 않습니다.',
  },
  {
    stat: '하루 10통',
    statLabel: '현장 10곳 관리 시 확인 전화',
    title: '현장 현황을 전화로 확인합니다',
    description:
      '어느 건물이 오늘 점검을 마쳤는지 알려면 현장마다 전화를 돌려야 합니다. 관리 현장이 늘수록 확인 전화도 그만큼 늘어납니다.',
  },
  {
    stat: '10건 중 3~4건',
    statLabel: '기록 없이 누락되는 민원',
    title: '민원이 기록 없이 사라집니다',
    description:
      '전화·구두로 들어온 민원은 처리 과정에서 누락되기 쉽습니다. 누가 언제 접수하고 처리했는지 남지 않아 같은 불만이 반복됩니다.',
  },
]
