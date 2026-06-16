'use server'

// =============================================================================
// spotcare.kr MVP — 워크스페이스 CRUD Server Actions
// =============================================================================
//
// 멀티테넌트 격리 1차 방어선: 모든 쿼리에 tenant_id 필터를 명시한다.
//   - SELECT/UPDATE/DELETE → .eq('tenant_id', tenantId)
//   - INSERT → tenant_id 값 주입
// (service_role 키는 RLS 를 우회하므로 이 코드 레벨 필터가 실질 격리선이다.)
//
// 반환 타입 규약:
//   성공 → { success: true, data?: T }
//   실패 → { success: false, error: string }
// =============================================================================

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { createClient } from '@/lib/supabase/server'
import { workspaceSchema } from '@/lib/validations/workspace'
import type { Workspace } from '@/types/database'

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

const WORKSPACES_PATH = '/dashboard/workspaces'

/**
 * 세션에서 tenantId 를 추출한다. 미인증이면 null.
 * (타입 확장 완료 — session.user.tenantId 는 any 캐스팅 불필요)
 */
async function getTenantId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.tenantId ?? null
}

// -----------------------------------------------------------------------------
// 조회
// -----------------------------------------------------------------------------

/**
 * 현재 테넌트의 워크스페이스 목록을 최신순으로 반환한다.
 * 미인증이거나 오류 시 빈 배열을 반환한다(목록 렌더 안전).
 */
export async function getWorkspaces(): Promise<Workspace[]> {
  const tenantId = await getTenantId()
  if (!tenantId) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

/**
 * 단일 워크스페이스를 조회한다(상세/수정 폼 프리필용).
 * tenant_id 필터로 타 테넌트 행 접근을 차단한다.
 */
export async function getWorkspace(
  id: string
): Promise<ActionResult<Workspace>> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: '로그인이 필요합니다.' }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (error) return { success: false, error: '워크스페이스 조회 중 오류가 발생했습니다.' }
  if (!data) return { success: false, error: '워크스페이스를 찾을 수 없습니다.' }
  return { success: true, data }
}

// -----------------------------------------------------------------------------
// 생성
// -----------------------------------------------------------------------------

/**
 * 워크스페이스 생성.
 * min_floor 는 UI 에서 지하 깊이를 양수로 받아 음수로 변환 저장한다.
 */
export async function createWorkspace(
  formData: FormData
): Promise<ActionResult<Workspace>> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: '로그인이 필요합니다.' }

  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.'
    return { success: false, error: first }
  }

  const { workspace_name, max_floor, min_floor } = parsed.data
  // UI 입력(양수 깊이) → DB 저장(음수). 0 은 그대로(지하 없음).
  const minFloorValue = min_floor > 0 ? -min_floor : min_floor

  const supabase = createClient()
  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      tenant_id: tenantId,
      workspace_name,
      max_floor,
      min_floor: minFloorValue,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: '워크스페이스 생성 중 오류가 발생했습니다.' }
  }

  revalidatePath(WORKSPACES_PATH)
  return { success: true, data }
}

// -----------------------------------------------------------------------------
// 수정
// -----------------------------------------------------------------------------

/**
 * 워크스페이스 수정.
 * WHERE 에 tenant_id 를 포함하여 타 테넌트 행 변경을 차단한다.
 */
export async function updateWorkspace(
  id: string,
  formData: FormData
): Promise<ActionResult<Workspace>> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: '로그인이 필요합니다.' }

  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.'
    return { success: false, error: first }
  }

  const { workspace_name, max_floor, min_floor } = parsed.data
  const minFloorValue = min_floor > 0 ? -min_floor : min_floor

  const supabase = createClient()
  const { data, error } = await supabase
    .from('workspaces')
    .update({ workspace_name, max_floor, min_floor: minFloorValue })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .maybeSingle()

  if (error) {
    return { success: false, error: '워크스페이스 수정 중 오류가 발생했습니다.' }
  }
  if (!data) {
    return { success: false, error: '워크스페이스를 찾을 수 없습니다.' }
  }

  revalidatePath(WORKSPACES_PATH)
  return { success: true, data }
}

// -----------------------------------------------------------------------------
// 삭제
// -----------------------------------------------------------------------------

/**
 * 워크스페이스 삭제.
 * 하위 facility_types / facilities 는 DB FK ON DELETE CASCADE 로 함께 삭제된다.
 * WHERE 에 tenant_id 를 포함하여 타 테넌트 행 삭제를 차단한다.
 */
export async function deleteWorkspace(id: string): Promise<ActionResult> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: '로그인이 필요합니다.' }

  const supabase = createClient()
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { success: false, error: '워크스페이스 삭제 중 오류가 발생했습니다.' }
  }

  revalidatePath(WORKSPACES_PATH)
  return { success: true }
}
