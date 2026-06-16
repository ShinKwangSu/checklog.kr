import { auth } from '@/auth'
import { createClient } from '@/lib/supabase/server'
import {
  BuildingIcon,
  ListIcon,
  MapPinIcon,
  BarChart3Icon,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

async function getStats(tenantId: string) {
  const supabase = createClient()
  const [{ count: wsCount }, { count: typeCount }, { count: facilityCount }] =
    await Promise.all([
      supabase
        .from('workspaces')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase
        .from('facility_types')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
      supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
    ])
  return {
    wsCount: wsCount ?? 0,
    typeCount: typeCount ?? 0,
    facilityCount: facilityCount ?? 0,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const tenantId = (session?.user as any)?.tenantId as string | undefined

  const stats = tenantId
    ? await getStats(tenantId)
    : { wsCount: 0, typeCount: 0, facilityCount: 0 }

  const summaryCards = [
    {
      title: '워크스페이스',
      value: stats.wsCount,
      description: '등록된 건물/장소',
      icon: BuildingIcon,
    },
    {
      title: '시설 타입',
      value: stats.typeCount,
      description: '전체 공간 카테고리',
      icon: ListIcon,
    },
    {
      title: '시설',
      value: stats.facilityCount,
      description: '등록된 시설 총합',
      icon: MapPinIcon,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-sm text-muted-foreground">
          전체 워크스페이스 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* 요약 수치 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map(({ title, value, description, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 통계 플레이스홀더 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3Icon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">분석</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            준비 중
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 차트 플레이스홀더 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                워크스페이스별 시설 현황
              </CardTitle>
              <CardDescription>통계 항목을 구성 중입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-32 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 차트 플레이스홀더 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                층별 시설 분포
              </CardTitle>
              <CardDescription>통계 항목을 구성 중입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[80, 55, 90, 40, 70].map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-8 shrink-0" />
                    <Skeleton className="h-4" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 차트 플레이스홀더 3 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                시설 타입별 비율
              </CardTitle>
              <CardDescription>통계 항목을 구성 중입니다.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-6">
              <div className="relative">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skeleton className="h-16 w-16 rounded-full bg-background" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 차트 플레이스홀더 4 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                최근 등록 현황
              </CardTitle>
              <CardDescription>통계 항목을 구성 중입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
