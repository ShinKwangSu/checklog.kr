'use server'

// =============================================================================
// facility-type 도메인 — Server Actions (진입점)
// =============================================================================
// 규칙: facility.actions 와 동일(조회=getAccountId, 변경=requireAccountId+runAction,
// Zod 검증 후 도메인 입력 정규화, 클라이언트 주입, revalidatePath).
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAccountId, requireAccountId } from '@/lib/auth'
import { runAction, type ActionResult } from '@/lib/action-result'
import { DomainError } from '@/lib/domain-error'
import { facilityTypeSchema } from '../validations/facility-type.validations'
import { facilityTypeService } from '../service/facility-type.service'
import type { FacilityType } from '../types'

function facilityTypesPath(workspaceId: string): string {
  return `/dashboard/${workspaceId}/facility-types`
}

function parseFacilityTypeInput(formData: FormData) {
  const parsed = facilityTypeSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    throw new DomainError(parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.')
  }
  return { typeName: parsed.data.type_name }
}

// -----------------------------------------------------------------------------
// 조회
// -----------------------------------------------------------------------------

export async function getFacilityTypes(workspaceId: string): Promise<FacilityType[]> {
  try {
    const accountId = await getAccountId()
    if (!accountId) return []
    const supabase = createClient()
    return await facilityTypeService.listByWorkspace(supabase, accountId, workspaceId)
  } catch {
    return []
  }
}

// -----------------------------------------------------------------------------
// 변경
// -----------------------------------------------------------------------------

export async function createFacilityType(
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<FacilityType>> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const input = parseFacilityTypeInput(formData)
    const supabase = createClient()
    const created = await facilityTypeService.create(supabase, accountId, workspaceId, input)
    revalidatePath(facilityTypesPath(workspaceId))
    return created
  }, '시설 타입 생성 중 오류가 발생했습니다.')
}

export async function updateFacilityType(
  id: string,
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<FacilityType>> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const input = parseFacilityTypeInput(formData)
    const supabase = createClient()
    const updated = await facilityTypeService.update(supabase, accountId, workspaceId, id, input)
    revalidatePath(facilityTypesPath(workspaceId))
    return updated
  }, '시설 타입 수정 중 오류가 발생했습니다.')
}

export async function deleteFacilityType(
  id: string,
  workspaceId: string
): Promise<ActionResult> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const supabase = createClient()
    await facilityTypeService.remove(supabase, accountId, workspaceId, id)
    revalidatePath(facilityTypesPath(workspaceId))
    return undefined
  }, '시설 타입 삭제 중 오류가 발생했습니다.')
}
