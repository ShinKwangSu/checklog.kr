---
name: facility-backend
description: spotcare.kr MVP Next.js Server Actions 구현 가이드. 워크스페이스/시설 타입/시설 정보 CRUD, 층수 변환 유틸리티(floorToDisplay/generateFloorOptions), 멀티테넌트 격리 패턴. Backend Engineer 에이전트가 Server Action 구현 시 반드시 이 스킬을 사용한다. 'Server Action', 'CRUD', '층수 변환', '시설', '워크스페이스' 구현 시 트리거.
---

# Facility Backend — Server Actions & Business Logic

## 층수 변환 유틸리티 (`lib/utils/floor.ts`)

```typescript
/**
 * 정수 층수를 표시 문자열로 변환
 * 양수: 3 → "3F"
 * 음수: -1 → "B1"
 */
export function floorToDisplay(floor: number): string {
  if (floor > 0) return `${floor}F`
  if (floor < 0) return `B${Math.abs(floor)}`
  return '0F' // 0층은 명세에 없음 — 필요 시 조정
}

/**
 * 워크스페이스의 층수 범위로 드롭다운 옵션 생성
 * max_floor=3, min_floor=-1 → [3F, 2F, 1F, B1] 순
 */
export function generateFloorOptions(
  max_floor: number,
  min_floor: number
): { value: number; label: string }[] {
  const options: { value: number; label: string }[] = []
  
  for (let floor = max_floor; floor >= min_floor; floor--) {
    if (floor === 0) continue // 0층 건너뜀 (지상/지하 경계)
    options.push({ value: floor, label: floorToDisplay(floor) })
  }
  
  return options
}
```

## Supabase 클라이언트 (`lib/supabase/`)

```typescript
// lib/supabase/server.ts — Server Component, Server Action, Route Handler용
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // 서버에서는 service role 키 사용
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
}
```

## 공통 패턴 — tenant_id 필터

**모든 Server Action은 이 패턴을 따른다.**

```typescript
'use server'
import { auth } from '@/auth'
import { createClient } from '@/lib/supabase/server'

async function getTenantId(): Promise<string> {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  return (session.user as any).tenantId
}
```

## 워크스페이스 Server Actions (`app/actions/workspace.ts`)

```typescript
'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { createClient } from '@/lib/supabase/server'

const workspaceSchema = z.object({
  workspace_name: z.string().min(1),
  max_floor: z.coerce.number().int().min(0),
  min_floor: z.coerce.number().int().max(0), // 지하는 음수 또는 0
})

export async function createWorkspace(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { success: false, error: 'Unauthorized' }
  const tenantId = (session.user as any).tenantId

  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { success: false, error: '입력값을 확인해주세요.' }

  const { workspace_name, max_floor, min_floor } = parsed.data
  // min_floor UI 입력값 처리: 사용자가 "2"를 입력하면 "-2"로 저장
  const minFloorValue = min_floor > 0 ? -min_floor : min_floor

  const supabase = createClient()
  const { error } = await supabase
    .from('workspaces')
    .insert({ tenant_id: tenantId, workspace_name, max_floor, min_floor: minFloorValue })

  if (error) return { success: false, error: '워크스페이스 생성 중 오류가 발생했습니다.' }
  revalidatePath('/dashboard/workspaces')
  return { success: true }
}

export async function getWorkspaces() {
  const session = await auth()
  if (!session?.user) return []
  const tenantId = (session.user as any).tenantId

  const supabase = createClient()
  const { data } = await supabase
    .from('workspaces')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return data ?? []
}

// updateWorkspace, deleteWorkspace — 동일 패턴, tenant_id 필터 필수
```

## 시설 타입 Server Actions (`app/actions/facility-type.ts`)

```typescript
// createFacilityType, getFacilityTypes, updateFacilityType, deleteFacilityType
// 공통 패턴: workspace_id AND tenant_id 모두 WHERE 조건에 포함

export async function getFacilityTypes(workspaceId: string) {
  const session = await auth()
  if (!session?.user) return []
  const tenantId = (session.user as any).tenantId

  const supabase = createClient()
  const { data } = await supabase
    .from('facility_types')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('tenant_id', tenantId) // 이중 필터로 격리 보장
    .order('created_at')

  return data ?? []
}
```

## 시설 정보 Server Actions (`app/actions/facility.ts`)

```typescript
const facilitySchema = z.object({
  facility_name: z.string().min(1),
  floor: z.coerce.number().int(),
  facility_type_id: z.string().uuid(),
  location_description: z.string().optional(),
  notes: z.string().optional(),
})

// floor 값은 UI의 Select에서 정수로 전달됨 (floorToDisplay 역변환 불필요)
// DB 저장: floor = 3 (3층), floor = -1 (지하 1층)
```

## Zod 검증 스키마 위치

`lib/validations/workspace.ts`, `lib/validations/facility-type.ts`, `lib/validations/facility.ts`에 스키마를 별도 파일로 분리하여 Server Action과 UI Form에서 공유한다.

## 체크리스트

- [ ] 모든 Server Action에 `tenant_id` 필터 포함
- [ ] `floorToDisplay()`와 `generateFloorOptions()` export
- [ ] `min_floor` UI 입력(양수) → DB 저장(음수) 변환 처리
- [ ] Zod로 모든 입력 검증
- [ ] 성공/실패 일관된 반환 타입 `{ success: boolean, data?, error? }`
- [ ] `revalidatePath()`로 캐시 무효화
