'use client'

// =============================================================================
// account 도메인 — Client Hooks
// =============================================================================
// Client Component 전용. 공유 query options 와 mutation + invalidation 만 사용한다.
// =============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountQueryOptions, accountQueryKeys } from '../queries'
import {
  updateAccountAction,
  deleteAccountAction,
} from '../actions/account.actions'

/** 고객 목록 조회 (검색 + 페이지네이션) */
export function useAccounts(page = 1, search?: string) {
  return useQuery(accountQueryOptions.list(page, search))
}

/** 고객 상세 조회 */
export function useAccount(accountId: string) {
  return useQuery(accountQueryOptions.detail(accountId))
}

/** 고객 수정 — 해당 상세 + 목록만 무효화 */
export function useUpdateAccount(accountId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      updateAccountAction(accountId, undefined, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accountQueryKeys.detail(accountId),
      })
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.lists() })
    },
  })
}

/** 고객 삭제 — 목록만 무효화하고 삭제된 상세 캐시는 제거 */
export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (accountId: string) => deleteAccountAction(accountId),
    onSuccess: (_result, accountId) => {
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.lists() })
      queryClient.removeQueries({
        queryKey: accountQueryKeys.detail(accountId),
      })
    },
  })
}
