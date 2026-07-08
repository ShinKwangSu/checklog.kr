// =============================================================================
// 고객 상세/수정 페이지
// =============================================================================
// Server Component. accountPrefetch.detail(accountId) 후 HydrationBoundary 전달.
// =============================================================================

import { HydrationBoundary } from '@tanstack/react-query'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

import { runPrefetch } from '@/lib/react-query/prefetch'
import { accountPrefetch } from '@/domain/account'
import { AccountDetailView } from '@/components/account-detail-view'
import { Button } from '@checklog/ui/components/button'

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>
}) {
  const { accountId } = await params
  const state = await runPrefetch(accountPrefetch.detail(accountId))

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/accounts">
            <ChevronLeft className="h-4 w-4" />
            고객 목록
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">고객 상세</h1>
          <p className="text-sm text-muted-foreground">
            업체 정보 수정 및 워크스페이스 현황을 확인합니다.
          </p>
        </div>
      </div>

      <HydrationBoundary state={state}>
        <AccountDetailView accountId={accountId} />
      </HydrationBoundary>
    </div>
  )
}
