// =============================================================================
// 고객 목록 페이지
// =============================================================================
// Server Component. searchParams 의 page/search 로 prefetch 후 전달.
// =============================================================================

import { HydrationBoundary } from '@tanstack/react-query'

import { runPrefetch } from '@/lib/react-query/prefetch'
import { accountPrefetch } from '@/domain/account'
import { AccountsTable } from '@/components/accounts-table'

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const { page: pageParam, search } = await searchParams
  const page = Number(pageParam) || 1

  const state = await runPrefetch(accountPrefetch.list(page, search || undefined))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">고객 관리</h1>
        <p className="text-sm text-muted-foreground">
          가입한 시설 관리 업체(고객)를 조회하고 관리합니다.
        </p>
      </div>

      <HydrationBoundary state={state}>
        <AccountsTable />
      </HydrationBoundary>
    </div>
  )
}
