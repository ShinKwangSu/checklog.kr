// =============================================================================
// inspection 도메인 — Query Options
// =============================================================================
// 모든 쿼리는 이 공유 옵션 팩토리를 통해 생성한다. 인라인 useQuery 금지.
// =============================================================================

import { queryOptions } from '@tanstack/react-query'
import { getInspectionHistory, getInspectionDetail } from '../actions/inspection.actions'
import { inspectionQueryKeys } from './inspection.query-keys'

export const inspectionQueryOptions = {
  history: (facilityId: string) =>
    queryOptions({
      queryKey: inspectionQueryKeys.history(facilityId),
      queryFn: () => getInspectionHistory(facilityId),
      staleTime: 60_000,
    }),
  detail: (sessionId: string, facilityId: string) =>
    queryOptions({
      queryKey: inspectionQueryKeys.detail(sessionId, facilityId),
      queryFn: () => getInspectionDetail(sessionId, facilityId),
      staleTime: 5 * 60_000,
    }),
}
