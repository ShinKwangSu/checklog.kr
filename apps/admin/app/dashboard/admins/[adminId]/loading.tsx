// =============================================================================
// 어드민 상세 로딩 스켈레톤
// =============================================================================
// Server Component 의 adminPrefetch.detail await 동안 표시된다.
// AdminEditForm 과 동일한 카드 골격(이름/이메일 입력 2줄)을 사용한다.
// =============================================================================

import {
  Card,
  CardContent,
  CardHeader,
} from '@checklog/ui/components/card'
import { Skeleton } from '@checklog/ui/components/skeleton'

export default function AdminDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-5 w-64" />
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}
