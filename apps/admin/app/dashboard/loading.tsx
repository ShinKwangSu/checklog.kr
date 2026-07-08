// =============================================================================
// 대시보드 홈 로딩 스켈레톤
// =============================================================================
// Server Component 의 statsPrefetch await 동안 표시된다.
// DashboardStatsCards 의 카드 그리드 레이아웃과 동일한 골격을 사용한다.
// =============================================================================

import { Card, CardContent, CardHeader } from '@checklog/ui/components/card'
import { Skeleton } from '@checklog/ui/components/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
