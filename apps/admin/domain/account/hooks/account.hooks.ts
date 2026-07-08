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

/** 고객 수정 */
export function useUpdateAccount(accountId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      updateAccountAction(accountId, undefined, formData),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.all }),
  })
}

/** 고객 삭제 */
export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (accountId: string) => deleteAccountAction(accountId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.all }),
  })
}
