// =============================================================================
// account 도메인 — Query Options
// =============================================================================
// 모든 쿼리는 이 공유 옵션 팩토리를 통해 생성한다. 인라인 useQuery 금지.
// =============================================================================

import { queryOptions } from '@tanstack/react-query'
import {
  getAccountsAction,
  getAccountDetailAction,
} from '../actions/account.actions'
import { accountQueryKeys } from './account.query-keys'

export const accountQueryOptions = {
  list: (page = 1, search?: string) =>
    queryOptions({
      queryKey: accountQueryKeys.list(page, search),
      queryFn: () => getAccountsAction(page, search),
      // 목록은 mutation invalidate 로 정확히 갱신되므로 짧은 staleTime 으로 충분하다.
      staleTime: 60_000,
    }),
  detail: (accountId: string) =>
    queryOptions({
      queryKey: accountQueryKeys.detail(accountId),
      queryFn: () => getAccountDetailAction(accountId),
      staleTime: 5 * 60_000,
    }),
}
