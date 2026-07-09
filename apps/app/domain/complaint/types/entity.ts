// =============================================================================
// complaint 도메인 — 엔티티 타입
// =============================================================================

import type { Complaint } from '@checklog/database'

export type { Complaint }

export type ComplaintStatus = 'received' | 'in_progress' | 'resolved'

/** 워크스페이스 민원 관리 목록에서 시설명을 덧붙인 형태 */
export type ComplaintWithFacility = Complaint & {
  facility_name: string
}
