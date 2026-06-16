'use client'

// =============================================================================
// spotcare.kr MVP — 대시보드 사이드바 네비게이션
// =============================================================================
// - 상단: 워크스페이스 목록 링크
// - 워크스페이스가 선택(URL 의 [workspaceId] 매칭)되면 하위 메뉴 노출:
//   시설 타입 관리 / 시설 정보 관리
// 서버 레이아웃에서 workspaces 를 받아 클라이언트로 렌더한다(활성 경로 강조용).
// =============================================================================

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LayoutGrid, Layers, Boxes } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Workspace } from '@/types/database'
import { LogoutButton } from '@/components/logout-button'

type Props = {
  workspaces: Pick<Workspace, 'id' | 'workspace_name'>[]
  userName?: string | null
}

export function DashboardSidebar({ workspaces, userName }: Props) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Building2 className="h-5 w-5 text-primary" />
        <span className="font-semibold">spotcare.kr</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <Link
          href="/dashboard/workspaces"
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/dashboard/workspaces'
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          워크스페이스
        </Link>

        <div className="pt-2">
          <p className="px-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">
            내 워크스페이스
          </p>
          {workspaces.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              아직 워크스페이스가 없습니다.
            </p>
          ) : (
            <ul className="space-y-1">
              {workspaces.map((ws) => {
                const base = `/dashboard/${ws.id}`
                const isActive = pathname.startsWith(base)
                return (
                  <li key={ws.id}>
                    <div
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium',
                        isActive
                          ? 'bg-accent/60 text-accent-foreground'
                          : 'text-foreground'
                      )}
                    >
                      <span className="line-clamp-1">{ws.workspace_name}</span>
                    </div>
                    {isActive && (
                      <ul className="ml-3 mt-1 space-y-1 border-l pl-3">
                        <li>
                          <SubLink
                            href={`${base}/facility-types`}
                            active={pathname === `${base}/facility-types`}
                            icon={<Layers className="h-4 w-4" />}
                            label="시설 타입 관리"
                          />
                        </li>
                        <li>
                          <SubLink
                            href={`${base}/facilities`}
                            active={pathname === `${base}/facilities`}
                            icon={<Boxes className="h-4 w-4" />}
                            label="시설 정보 관리"
                          />
                        </li>
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </nav>

      <div className="border-t p-3">
        {userName && (
          <p className="px-3 pb-2 text-xs text-muted-foreground">
            {userName} 님
          </p>
        )}
        <LogoutButton />
      </div>
    </aside>
  )
}

function SubLink({
  href,
  active,
  icon,
  label,
}: {
  href: string
  active: boolean
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {icon}
      {label}
    </Link>
  )
}
