'use server'

// =============================================================================
// facility 도메인 — Server Actions (진입점)
// =============================================================================
//
// 규칙:
// - 인증(accountId 확보)은 이 레이어에서 강제한다.
//   · 조회: getAccountId() — 미인증 시 빈 결과로 처리(서버 컴포넌트 계약 유지).
//   · 변경: requireAccountId() — 미인증 시 DomainError → '로그인이 필요합니다.'
// - 입력은 Zod(facilitySchema)로 검증하고 도메인 입력(camelCase)으로 정규화해 service 에 넘긴다.
// - 변경 액션은 runAction 봉투로 ActionResult 를 반환한다(컴포넌트 계약 유지).
// - Supabase 클라이언트는 이 레이어에서 생성해 service 로 주입한다.
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAccountId, requireAccountId } from '@/lib/auth'
import { runAction, type ActionResult } from '@/lib/action-result'
import { DomainError } from '@/lib/domain-error'
import { facilitySchema } from '@/lib/validations/facility'
import { facilityService } from '../service/facility.service'
import type { Facility, FacilityWithChecklists } from '../types'

function facilitiesPath(workspaceId: string): string {
  // UI 라우트 구조와 일치: /dashboard/[workspaceId]/facilities
  return `/dashboard/${workspaceId}/facilities`
}

/** FormData → 도메인 입력. Zod 실패 시 DomainError 로 사용자 메시지 노출. */
function parseFacilityInput(formData: FormData) {
  const parsed = facilitySchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    throw new DomainError(parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.')
  }
  const checklistId = (formData.get('checklist_id') as string) || null
  return {
    facilityName: parsed.data.facility_name,
    floor: parsed.data.floor,
    facilityTypeId: parsed.data.facility_type_id,
    memo: parsed.data.memo ?? null,
    checklistId,
  }
}

// -----------------------------------------------------------------------------
// 조회
// -----------------------------------------------------------------------------

/**
 * 워크스페이스 시설 목록. 미인증/오류 시 빈 배열(서버 컴포넌트가 배열을 기대).
 */
export async function getFacilities(
  workspaceId: string
): Promise<FacilityWithChecklists[]> {
  try {
    const accountId = await getAccountId()
    if (!accountId) return []
    const supabase = createClient()
    return await facilityService.listByWorkspace(supabase, accountId, workspaceId)
  } catch {
    return []
  }
}

/** 시설 단건 (수정 폼 프리필용) */
export async function getFacility(id: string): Promise<ActionResult<Facility>> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const supabase = createClient()
    return facilityService.getById(supabase, accountId, id)
  }, '시설 조회 중 오류가 발생했습니다.')
}

// -----------------------------------------------------------------------------
// 변경
// -----------------------------------------------------------------------------

export async function createFacility(
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<Facility>> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const input = parseFacilityInput(formData)
    const supabase = createClient()
    const facility = await facilityService.create(supabase, accountId, workspaceId, input)
    revalidatePath(facilitiesPath(workspaceId))
    return facility
  }, '시설 생성 중 오류가 발생했습니다.')
}

export async function updateFacility(
  id: string,
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<Facility>> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const input = parseFacilityInput(formData)
    const supabase = createClient()
    const facility = await facilityService.update(supabase, accountId, workspaceId, id, input)
    revalidatePath(facilitiesPath(workspaceId))
    return facility
  }, '시설 수정 중 오류가 발생했습니다.')
}

export async function deleteFacility(
  id: string,
  workspaceId: string
): Promise<ActionResult> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const supabase = createClient()
    await facilityService.remove(supabase, accountId, workspaceId, id)
    revalidatePath(facilitiesPath(workspaceId))
    // void 액션도 ActionResult<undefined> 로 통일한다(컴포넌트 계약).
    return undefined
  }, '시설 삭제 중 오류가 발생했습니다.')
}
