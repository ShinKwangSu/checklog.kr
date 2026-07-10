'use server'

// =============================================================================
// inspector 도메인 — Server Actions (진입점)
// =============================================================================
// 규칙: facility.actions 와 동일. email/phone 빈 문자열은 null 로 정규화한다.
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAccountId, requireAccountId } from '@/lib/auth'
import { runAction, type ActionResult } from '@/lib/action-result'
import { DomainError } from '@/lib/domain-error'
import { inspectorSchema } from '../validations/inspector.validations'
import { inspectorService } from '../service/inspector.service'
import type { Inspector } from '../types'

function inspectorsPath(workspaceId: string): string {
  return `/dashboard/${workspaceId}/inspectors`
}

function parseInspectorInput(formData: FormData) {
  const parsed = inspectorSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    throw new DomainError(parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.')
  }
  return {
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
  }
}

export async function getInspectors(workspaceId: string): Promise<Inspector[]> {
  try {
    const accountId = await getAccountId()
    if (!accountId) return []
    const supabase = createClient()
    return await inspectorService.listByWorkspace(supabase, accountId, workspaceId)
  } catch {
    return []
  }
}

export async function createInspector(
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<Inspector>> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const input = parseInspectorInput(formData)
    const supabase = createClient()
    const created = await inspectorService.create(supabase, accountId, workspaceId, input)
    revalidatePath(inspectorsPath(workspaceId))
    return created
  }, '점검자 생성 중 오류가 발생했습니다.')
}

export async function updateInspector(
  id: string,
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<Inspector>> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const input = parseInspectorInput(formData)
    const supabase = createClient()
    const updated = await inspectorService.update(supabase, accountId, workspaceId, id, input)
    revalidatePath(inspectorsPath(workspaceId))
    return updated
  }, '점검자 수정 중 오류가 발생했습니다.')
}

export async function deleteInspector(
  id: string,
  workspaceId: string
): Promise<ActionResult> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const supabase = createClient()
    await inspectorService.remove(supabase, accountId, workspaceId, id)
    revalidatePath(inspectorsPath(workspaceId))
    return undefined
  }, '점검자 삭제 중 오류가 발생했습니다.')
}
