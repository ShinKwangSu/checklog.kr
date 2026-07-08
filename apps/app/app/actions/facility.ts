'use server'

// =============================================================================
// checklog.kr MVP — 시설 정보 CRUD Server Actions
// =============================================================================
//
// 격리 패턴: 모든 쿼리에 account_id 와 workspace_id 를 함께 필터한다.
//   추가로 facility_type_id 가 같은 고객/워크스페이스 소속인지 검증한다
//   (타 워크스페이스의 타입으로 시설을 분류하는 것을 차단).
//
// floor: UI Select(generateFloorOptions)에서 정수로 전달된다. 역변환 불필요.
//   지상=양수, 지하=음수, 층 없음=0. 표시 변환은 floorToDisplay(앱 레이어).
//
// 소프트 딜리트: .delete() 대신 deleted_at = NOW() 업데이트.
//   - 모든 SELECT 에 .is('deleted_at', null) 필터 추가.
//   - facility_checklists 는 조인 테이블이므로 hard delete 유지.
//
// 반환 타입 규약: { success: true, data? } | { success: false, error }
// =============================================================================

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { createClient } from '@/lib/supabase/server'
import { facilitySchema } from '@/lib/validations/facility'
import type { Facility, FacilityWithChecklists } from '@/types/database'
import type { ActionResult } from '@/app/actions/workspace'

async function getAccountId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.accountId ?? null
}

function facilitiesPath(workspaceId: string): string {
  // UI 라우트 구조와 일치: /dashboard/[workspaceId]/facilities
  return `/dashboard/${workspaceId}/facilities`
}

/**
 * facility_type_id 가 현재 고객 + 지정 워크스페이스 소속인지 확인한다.
 * 타 워크스페이스/고객의 타입으로 시설을 분류하는 것을 차단한다.
 */
async function assertFloorInRange(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  accountId: string,
  floor: number
): Promise<boolean> {
  const { data: ws } = await supabase
    .from('workspaces')
    .select('min_floor, max_floor')
    .eq('id', workspaceId)
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!ws) return false
  if (floor === 0) return false
  return floor >= ws.min_floor && floor <= ws.max_floor
}

async function assertFacilityTypeOwned(
  supabase: ReturnType<typeof createClient>,
  facilityTypeId: string,
  workspaceId: string,
  accountId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('facility_types')
    .select('id')
    .eq('id', facilityTypeId)
    .eq('workspace_id', workspaceId)
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .maybeSingle()
  return !!data
}

// -----------------------------------------------------------------------------
// 조회
// -----------------------------------------------------------------------------

/**
 * 지정 워크스페이스의 시설 목록을 반환한다.
 * 정렬: 층수 내림차순(상층 우선) → 생성순. INT 컬럼으로 SQL 정렬(추가 연산 불필요).
 * account_id + workspace_id 이중 필터로 격리를 보장한다.
 */
export async function getFacilities(
  workspaceId: string
): Promise<FacilityWithChecklists[]> {
  const accountId = await getAccountId()
  if (!accountId) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('facilities')
    .select('*, facility_checklists(checklist_id)')
    .eq('workspace_id', workspaceId)
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .order('floor', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) return []
  return (data ?? []) as unknown as FacilityWithChecklists[]
}

/**
 * 단일 시설 조회(수정 폼 프리필용).
 */
export async function getFacility(
  id: string
): Promise<ActionResult<Facility>> {
  const accountId = await getAccountId()
  if (!accountId) return { success: false, error: '로그인이 필요합니다.' }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', id)
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) return { success: false, error: '시설 조회 중 오류가 발생했습니다.' }
  if (!data) return { success: false, error: '시설을 찾을 수 없습니다.' }
  return { success: true, data }
}

// -----------------------------------------------------------------------------
// 생성
// -----------------------------------------------------------------------------

/**
 * 시설 생성. workspaceId 는 액션 인자로 전달된다.
 */
export async function createFacility(
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<Facility>> {
  const accountId = await getAccountId()
  if (!accountId) return { success: false, error: '로그인이 필요합니다.' }

  const raw = Object.fromEntries(formData)
  const parsed = facilitySchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.'
    return { success: false, error: first }
  }

  const { facility_name, floor, facility_type_id, memo } = parsed.data
  const checklistId = (raw.checklist_id as string) || null

  const supabase = createClient()

  if (!(await assertFloorInRange(supabase, workspaceId, accountId, floor))) {
    return { success: false, error: '유효하지 않은 층수입니다.' }
  }

  // 선택한 타입이 이 워크스페이스/고객 소속인지 검증.
  if (
    !(await assertFacilityTypeOwned(
      supabase,
      facility_type_id,
      workspaceId,
      accountId
    ))
  ) {
    return { success: false, error: '올바른 시설 타입을 선택해주세요.' }
  }

  const { data, error } = await supabase
    .from('facilities')
    .insert({
      account_id: accountId,
      workspace_id: workspaceId,
      facility_type_id,
      facility_name,
      floor,
      memo: memo ?? null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: '시설 생성 중 오류가 발생했습니다.' }
  }

  if (checklistId) {
    await supabase.from('facility_checklists').insert({
      facility_id: data.id,
      checklist_id: checklistId,
      workspace_id: workspaceId,
      account_id: accountId,
    })
  }

  revalidatePath(facilitiesPath(workspaceId))
  return { success: true, data }
}

// -----------------------------------------------------------------------------
// 수정
// -----------------------------------------------------------------------------

/**
 * 시설 수정.
 * account_id + workspace_id 를 WHERE 에 포함하고, 변경된 타입의 소속도 재검증한다.
 */
export async function updateFacility(
  id: string,
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<Facility>> {
  const accountId = await getAccountId()
  if (!accountId) return { success: false, error: '로그인이 필요합니다.' }

  const raw = Object.fromEntries(formData)
  const parsed = facilitySchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.'
    return { success: false, error: first }
  }

  const { facility_name, floor, facility_type_id, memo } = parsed.data
  const checklistId = (raw.checklist_id as string) || null

  const supabase = createClient()

  if (!(await assertFloorInRange(supabase, workspaceId, accountId, floor))) {
    return { success: false, error: '유효하지 않은 층수입니다.' }
  }

  if (
    !(await assertFacilityTypeOwned(
      supabase,
      facility_type_id,
      workspaceId,
      accountId
    ))
  ) {
    return { success: false, error: '올바른 시설 타입을 선택해주세요.' }
  }

  const { data, error } = await supabase
    .from('facilities')
    .update({
      facility_type_id,
      facility_name,
      floor,
      memo: memo ?? null,
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .eq('account_id', accountId)
    .is('deleted_at', null)
    .select()
    .maybeSingle()

  if (error) {
    return { success: false, error: '시설 수정 중 오류가 발생했습니다.' }
  }
  if (!data) {
    return { success: false, error: '시설을 찾을 수 없습니다.' }
  }

  // 점검표 연결 전체 교체 (삭제 후 재삽입)
  await supabase
    .from('facility_checklists')
    .delete()
    .eq('facility_id', id)
    .eq('account_id', accountId)

  if (checklistId) {
    await supabase.from('facility_checklists').insert({
      facility_id: id,
      checklist_id: checklistId,
      workspace_id: workspaceId,
      account_id: accountId,
    })
  }

  revalidatePath(facilitiesPath(workspaceId))
  return { success: true, data }
}

// -----------------------------------------------------------------------------
// 삭제 (소프트 딜리트)
// -----------------------------------------------------------------------------

export async function deleteFacility(
  id: string,
  workspaceId: string
): Promise<ActionResult> {
  const accountId = await getAccountId()
  if (!accountId) return { success: false, error: '로그인이 필요합니다.' }

  const supabase = createClient()
  const { error } = await supabase
    .from('facilities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .eq('account_id', accountId)
    .is('deleted_at', null)

  if (error) {
    return { success: false, error: '시설 삭제 중 오류가 발생했습니다.' }
  }

  revalidatePath(facilitiesPath(workspaceId))
  return { success: true }
}
