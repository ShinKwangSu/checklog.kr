'use client'

// =============================================================================
// complaint 도메인 — Client Hooks
// =============================================================================
// Client Component 전용. 공유 query options 와 mutation + invalidation 만 사용한다.
// =============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { complaintQueryOptions, complaintQueryKeys } from '../queries'
import { updateComplaintStatus } from '../actions/complaint.actions'
import type { ComplaintStatus } from '../types'

/** 시설별 민원이력 목록 조회 */
export function useComplaints(facilityId: string) {
  return useQuery(complaintQueryOptions.list(facilityId))
}

/** 민원 상태 변경 — 해당 시설 목록만 무효화 */
export function useUpdateComplaintStatus(facilityId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      complaintId,
      status,
    }: {
      complaintId: string
      status: ComplaintStatus
    }) => updateComplaintStatus(complaintId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: complaintQueryKeys.list(facilityId),
      })
    },
  })
}
