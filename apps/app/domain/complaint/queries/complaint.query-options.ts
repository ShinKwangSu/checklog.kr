// =============================================================================
// complaint 도메인 — Query Options
// =============================================================================
// 모든 쿼리는 이 공유 옵션 팩토리를 통해 생성한다. 인라인 useQuery 금지.
// =============================================================================

import { queryOptions } from '@tanstack/react-query'
import { getComplaints } from '../actions/complaint.actions'
import { complaintQueryKeys } from './complaint.query-keys'

export const complaintQueryOptions = {
  list: (facilityId: string) =>
    queryOptions({
      queryKey: complaintQueryKeys.list(facilityId),
      queryFn: () => getComplaints(facilityId),
      staleTime: 60_000,
    }),
}
