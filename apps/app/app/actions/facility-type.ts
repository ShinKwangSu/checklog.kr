'use server'

// =============================================================================
// spotcare.kr MVP — 시설 타입 CRUD Server Actions
// =============================================================================
//
// 격리 패턴: 모든 쿼리에 tenant_id 와 workspace_id 를 함께 필터한다(이중 격리).
//
// 제약:
//   - DB UNIQUE(workspace_id, type_name) → 중복 시 23505 처리.
//   - facilities.facility_type_id 는 ON DELETE RESTRICT → 사용 중인 타입은
//     DB 가 삭제를 차단(23503). 사전에 사용 여부를 확인해 친화적 메시지 반환.
//
// 반환 타입 규약: { success: true, data? } | { success: false, error }
// =============================================================================

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { createClient } from '@/lib/supabase/server'
import { facilityTypeSchema } from '@/lib/validations/facility-type'
import type { FacilityType } from '@/types/database'
import type { ActionResult } from '@/app/actions/workspace'

async function getTenantId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.tenantId ?? null
}

function facilityTypesPath(workspaceId: string): string {
  // UI 라우트 구조와 일치: /dashboard/[workspaceId]/facility-types
  return `/dashboard/${workspaceId}/facility-types`
}

/**
 * workspaceId 가 현재 테넌트 소유인지 확인한다.
 * 타 테넌트의 workspaceId 로 자식 행을 끼워 넣는 것을 차단한다(권한 상승 방지).
 */
async function assertWorkspaceOwned(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  tenantId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  return !!data
}

// -----------------------------------------------------------------------------
// 조회
// -----------------------------------------------------------------------------

/**
 * 지정 워크스페이스의 시설 타입 목록을 반환한다(생성순).
 * tenant_id + workspace_id 이중 필터로 격리를 보장한다.
 */
export async function getFacilityTypes(
  workspaceId: string
): Promise<FacilityType[]> {
  const tenantId = await getTenantId()
  if (!tenantId) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('facility_types')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  if (error) return []
  return data ?? []
}

// -----------------------------------------------------------------------------
// 생성
// -----------------------------------------------------------------------------

/**
 * 시설 타입 생성. workspaceId 는 액션 인자로 전달된다.
 */
export async function createFacilityType(
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<FacilityType>> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: '로그인이 필요합니다.' }

  const parsed = facilityTypeSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.'
    return { success: false, error: first }
  }

  const supabase = createClient()

  // 워크스페이스 소유권 확인(타 테넌트 workspace_id 주입 차단).
  if (!(await assertWorkspaceOwned(supabase, workspaceId, tenantId))) {
    return { success: false, error: '워크스페이스를 찾을 수 없습니다.' }
  }

  const { data, error } = await supabase
    .from('facility_types')
    .insert({
      tenant_id: tenantId,
      workspace_id: workspaceId,
      type_name: parsed.data.type_name,
    })
    .select()
    .single()

  if (error) {
    // 23505 = unique_violation → 워크스페이스 내 타입명 중복
    if (error.code === '23505') {
      return { success: false, error: '이미 존재하는 타입 이름입니다.' }
    }
    return { success: false, error: '시설 타입 생성 중 오류가 발생했습니다.' }
  }

  revalidatePath(facilityTypesPath(workspaceId))
  return { success: true, data }
}

// -----------------------------------------------------------------------------
// 수정
// -----------------------------------------------------------------------------

/**
 * 시설 타입 이름 수정.
 * tenant_id + workspace_id 를 WHERE 에 포함해 타 테넌트/타 워크스페이스 행을 차단한다.
 */
export async function updateFacilityType(
  id: string,
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<FacilityType>> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: '로그인이 필요합니다.' }

  const parsed = facilityTypeSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.'
    return { success: false, error: first }
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('facility_types')
    .update({ type_name: parsed.data.type_name })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .eq('tenant_id', tenantId)
    .select()
    .maybeSingle()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: '이미 존재하는 타입 이름입니다.' }
    }
    return { success: false, error: '시설 타입 수정 중 오류가 발생했습니다.' }
  }
  if (!data) {
    return { success: false, error: '시설 타입을 찾을 수 없습니다.' }
  }

  revalidatePath(facilityTypesPath(workspaceId))
  return { success: true, data }
}

// -----------------------------------------------------------------------------
// 삭제
// -----------------------------------------------------------------------------

/**
 * 시설 타입 삭제.
 * 이 타입을 사용하는 facilities 가 있으면 DB FK(RESTRICT)가 삭제를 차단한다.
 * 사전에 사용 건수를 확인하여 친화적 메시지를 반환한다(이중 안전: DB 23503 도 처리).
 */
export async function deleteFacilityType(
  id: string,
  workspaceId: string
): Promise<ActionResult> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: '로그인이 필요합니다.' }

  const supabase = createClient()

  // 사용 중 여부 사전 확인(친화적 메시지용).
  const { count, error: countError } = await supabase
    .from('facilities')
    .select('id', { count: 'exact', head: true })
    .eq('facility_type_id', id)
    .eq('tenant_id', tenantId)

  if (countError) {
    return { success: false, error: '시설 타입 삭제 중 오류가 발생했습니다.' }
  }
  if ((count ?? 0) > 0) {
    return {
      success: false,
      error: '이 타입을 사용하는 시설이 있어 삭제할 수 없습니다. 먼저 시설을 삭제하거나 타입을 변경해주세요.',
    }
  }

  const { error } = await supabase
    .from('facility_types')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .eq('tenant_id', tenantId)

  if (error) {
    // 23503 = foreign_key_violation (RESTRICT) — 사전 확인과 동시성 차이 대비
    if (error.code === '23503') {
      return {
        success: false,
        error: '이 타입을 사용하는 시설이 있어 삭제할 수 없습니다.',
      }
    }
    return { success: false, error: '시설 타입 삭제 중 오류가 발생했습니다.' }
  }

  revalidatePath(facilityTypesPath(workspaceId))
  return { success: true }
}
