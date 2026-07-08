// =============================================================================
// 고객 상세 로딩 스켈레톤
// =============================================================================
// Server Component 의 accountPrefetch.detail await 동안 표시된다.
// AccountDetailView 의 isLoading 브랜치(업체 정보 카드)와 동일한 골격을 사용한다.
// =============================================================================

import {
  Card,
  CardContent,
  CardHeader,
} from '@checklog/ui/components/card'
import { Skeleton } from '@checklog/ui/components/skeleton'

export default function AccountDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-5 w-72" />
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
