import { getAccountId } from '@/lib/auth'
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
} from '@checklog/ui/components/card'

async function getStats(accountId: string) {
  const supabase = createClient()
  const [{ count: wsCount }, { count: typeCount }, { count: facilityCount }] =
    await Promise.all([
      supabase
        .from('workspaces')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId),
      supabase
        .from('facility_types')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId),
      supabase
        .from('facilities')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId),
    ])
  return {
    wsCount: wsCount ?? 0,
    typeCount: typeCount ?? 0,
    facilityCount: facilityCount ?? 0,
  }
}

export default async function DashboardPage() {
  const accountId = await getAccountId()

  const stats = accountId
    ? await getStats(accountId)
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

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <BarChart3Icon className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm">통계 항목을 구성 중입니다.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
