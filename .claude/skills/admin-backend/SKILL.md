---
name: admin-backend
description: checklog.kr apps/admin 슈퍼어드민 도메인 백엔드 구현 가이드. account/stats 도메인의 레이어드 아키텍처, 전체 데이터 접근 패턴. Backend Engineer 에이전트가 apps/admin 백엔드 구현 시 반드시 이 스킬을 사용한다.
---

# Admin Backend — apps/admin 도메인 구현

> 아키텍처 패턴(레이어 구조, repository 주입, ActionResult, React Query)은 `nextjs-guide` 스킬을 참조한다.

## 대상 앱 및 도메인 구조

**타겟 앱:** `apps/admin`

```
apps/admin/domain/
├── account/
│   ├── index.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── entity.ts          — Account 엔티티 (password_hash 제외)
│   │   └── dto.ts             — AccountListParams
│   ├── queries/
│   │   ├── index.ts
│   │   ├── account.query-keys.ts
│   │   ├── account.query-options.ts
│   │   └── account.prefetch.ts
│   ├── hooks/
│   │   ├── index.ts
│   │   └── account.hooks.ts
│   ├── actions/
│   │   └── account.actions.ts  — 'use server'
│   ├── service/
│   │   └── account.service.ts
│   ├── repository/
│   │   └── account.repository.ts
│   └── mapper/
│       └── account.mapper.ts
└── stats/                     — 동일 구조 (서비스 운영 통계)
```

## Import 규칙

```typescript
// Supabase 서버 클라이언트 — action 레이어에서만 생성
import { createServerSupabase } from '@checklog/database'

// 앱 내부 인증
import { auth } from '@/auth'
```

## 비즈니스 규칙 — 슈퍼어드민 전체 접근

**슈퍼어드민은 모든 고객 데이터에 접근한다. account_id 필터 없음.**

```typescript
// account.repository.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export const accountRepository = {
    async findAll(supabase: SupabaseClient, params: { page: number; pageSize: number }) {
        const from = (params.page - 1) * params.pageSize
        const to = from + params.pageSize - 1

        const { data, count, error } = await supabase
            .from('accounts')
            .select('id, company_name, admin_name, email, phone, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)
        if (error) throw error
        return { data: data ?? [], total: count ?? 0 }
    },

    async findById(supabase: SupabaseClient, accountId: string) {
        const { data, error } = await supabase
            .from('accounts')
            .select(`*, workspaces(id, workspace_name, max_floor, min_floor, created_at)`)
            .eq('id', accountId)
            .single()
        if (error) throw error
        return data
    },
}
```

## action 레이어 패턴

```typescript
// account.actions.ts
'use server'
import { auth } from '@/auth'
import { createServerSupabase } from '@checklog/database'
import { accountService } from '../service/account.service'

async function requireAdmin() {
    const session = await auth()
    if (!session?.user || !(session.user as any).adminId) {
        throw new Error('Unauthorized')
    }
}

export async function getAccountsAction(page = 1, pageSize = 20) {
    await requireAdmin()
    const supabase = createServerSupabase()
    return accountService.findAll(supabase, { page, pageSize })
}

export async function getAccountDetailAction(accountId: string) {
    await requireAdmin()
    const supabase = createServerSupabase()
    return accountService.findById(supabase, accountId)
}

export async function deleteAccountAction(accountId: string): Promise<ActionResult> {
    await requireAdmin()
    try {
        const supabase = createServerSupabase()
        await accountService.delete(supabase, accountId)
        return { success: true, data: undefined }
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : '고객 삭제 중 오류가 발생했습니다.' }
    }
}
```

## stats 도메인 (`stats/`)

```typescript
// stats.actions.ts
export async function getServiceStatsAction() {
    await requireAdmin()
    const supabase = createServerSupabase()

    const [accounts, workspaces, facilities] = await Promise.all([
        supabase.from('accounts').select('id', { count: 'exact', head: true }),
        supabase.from('workspaces').select('id', { count: 'exact', head: true }),
        supabase.from('facilities').select('id', { count: 'exact', head: true }),
    ])

    return {
        accountCount: accounts.count ?? 0,
        workspaceCount: workspaces.count ?? 0,
        facilityCount: facilities.count ?? 0,
    }
}
```

## mapper 패턴 — password_hash 노출 금지

```typescript
// account.mapper.ts
export function toAccountEntity(row: AccountRow): AccountEntity {
    return {
        id: row.id,
        companyName: row.company_name,
        adminName: row.admin_name,
        email: row.email,
        phone: row.phone ?? null,
        createdAt: row.created_at,
        // password_hash 절대 포함하지 않음
    }
}
```

## 체크리스트

- [ ] 도메인별 레이어드 구조(`nextjs-guide` 참조) 준수
- [ ] repository가 Supabase 클라이언트를 주입받음 (직접 생성 금지)
- [ ] 모든 action에서 `requireAdmin()` 호출
- [ ] account_id 필터 없음 (슈퍼어드민 전체 접근이 의도된 동작)
- [ ] mapper에서 `password_hash` 제외
- [ ] 변경 Action은 ActionResult 반환, 조회 Action은 throw
- [ ] 페이지네이션 적용 (`.range(from, to)`)
