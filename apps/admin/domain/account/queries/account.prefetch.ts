// =============================================================================
// account 도메인 — Prefetch
// =============================================================================
// Server Component 에서 runPrefetch 와 조합해 사용한다.
// =============================================================================

import type { QueryClient } from '@tanstack/react-query'
import { accountQueryOptions } from './account.query-options'

export const accountPrefetch = {
  list(page = 1, search?: string) {
    return async (queryClient: QueryClient) => {
      await queryClient.prefetchQuery(accountQueryOptions.list(page, search))
    }
  },
  detail(accountId: string) {
    return async (queryClient: QueryClient) => {
      await queryClient.prefetchQuery(accountQueryOptions.detail(accountId))
    }
  },
}
