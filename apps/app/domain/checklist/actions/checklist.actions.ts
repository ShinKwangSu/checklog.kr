'use server'

// =============================================================================
// checklist 도메인 — Server Actions (진입점)
// =============================================================================
// 규칙: facility.actions 와 동일. days/items 는 FormData 에 JSON 문자열로 담겨오므로
// 파싱 후 Zod 검증하고, 도메인 입력(camelCase)으로 정규화해 service 로 넘긴다.
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAccountId, requireAccountId } from '@/lib/auth'
import { runAction, type ActionResult } from '@/lib/action-result'
import { DomainError } from '@/lib/domain-error'
import { checklistSchema } from '@/lib/validations/checklist'
import { checklistService } from '../service/checklist.service'
import type { ChecklistWithItems, ChecklistWriteInput } from '../types'

function checklistsPath(workspaceId: string): string {
  return `/dashboard/${workspaceId}/checklists`
}

/** FormData(days/items JSON 포함) → 도메인 입력 */
function parseChecklistInput(formData: FormData): ChecklistWriteInput {
  const raw = Object.fromEntries(formData)
  const parsed = checklistSchema.safeParse({
    ...raw,
    days: raw.days ? JSON.parse(raw.days as string) : undefined,
    items: raw.items_json ? JSON.parse(raw.items_json as string) : [],
  })
  if (!parsed.success) {
    throw new DomainError(parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.')
  }
  return {
    checklistName: parsed.data.checklist_name,
    description: parsed.data.description || null,
    repeatCycle: parsed.data.repeat_cycle,
    count: parsed.data.count,
    days: parsed.data.days ?? null,
    items: parsed.data.items.map((i) => ({
      id: i.id,
      itemName: i.item_name,
      responseType: i.response_type,
      isRequired: i.is_required,
    })),
  }
}

export async function getChecklists(workspaceId: string): Promise<ChecklistWithItems[]> {
  try {
    const accountId = await getAccountId()
    if (!accountId) return []
    const supabase = createClient()
    return await checklistService.listByWorkspace(supabase, accountId, workspaceId)
  } catch {
    return []
  }
}

export async function createChecklist(
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<ChecklistWithItems>> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const input = parseChecklistInput(formData)
    const supabase = createClient()
    await checklistService.create(supabase, accountId, workspaceId, input)
    revalidatePath(checklistsPath(workspaceId))
    return undefined
  }, '점검표 생성 중 오류가 발생했습니다.')
}

export async function updateChecklist(
  id: string,
  workspaceId: string,
  formData: FormData
): Promise<ActionResult<ChecklistWithItems>> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const input = parseChecklistInput(formData)
    const supabase = createClient()
    await checklistService.update(supabase, accountId, workspaceId, id, input)
    revalidatePath(checklistsPath(workspaceId))
    return undefined
  }, '점검표 수정 중 오류가 발생했습니다.')
}

export async function deleteChecklist(
  id: string,
  workspaceId: string
): Promise<ActionResult> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const supabase = createClient()
    await checklistService.remove(supabase, accountId, workspaceId, id)
    revalidatePath(checklistsPath(workspaceId))
    return undefined
  }, '점검표 삭제 중 오류가 발생했습니다.')
}
