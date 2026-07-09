'use client'

// =============================================================================
// inspection 도메인 — Client Hooks
// =============================================================================
// Client Component 전용. 공유 query options 만 사용한다.
// =============================================================================

import { useQuery } from '@tanstack/react-query'
import { inspectionQueryOptions } from '../queries'

/** 시설별 점검이력 목록 조회 */
export function useInspectionHistory(facilityId: string) {
  return useQuery(inspectionQueryOptions.history(facilityId))
}

/** 점검 세션 상세 조회 */
export function useInspectionDetail(sessionId: string, facilityId: string) {
  return useQuery(inspectionQueryOptions.detail(sessionId, facilityId))
}
