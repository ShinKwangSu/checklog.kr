'use server'

// =============================================================================
// workspace 도메인 — Server Actions (진입점)
// =============================================================================
// 규칙: facility.actions 와 동일. 워크스페이스는 격리 최상위라 workspace_id 스코프가
// 없고 account_id 만으로 격리한다.
// =============================================================================

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAccountId, requireAccountId } from '@/lib/auth'
import { runAction, type ActionResult } from '@/lib/action-result'
import { DomainError } from '@/lib/domain-error'
// domain/auth 배럴은 server-only 이메일 발송 코드를 물고 있는 authService를 export하지
// 않는다(클라이언트 컴포넌트가 배럴을 import할 때 함께 딸려 들어가는 것을 막기 위해).
// 이 파일은 서버 전용 Server Action이므로 service 파일을 deep import 로 직접 쓴다.
// eslint-disable-next-line no-restricted-imports
import { authService } from '@/domain/auth/service/auth.service'
import { workspaceSchema } from '../validations/workspace.validations'
import { workspaceService } from '../service/workspace.service'
import type { Workspace } from '../types'

const WORKSPACES_PATH = '/dashboard/workspaces'

function parseWorkspaceInput(formData: FormData) {
  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    throw new DomainError(parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.')
  }
  return {
    workspaceName: parsed.data.workspace_name,
    maxFloor: parsed.data.max_floor,
    minFloorInput: parsed.data.min_floor,
    address: parsed.data.address ?? null,
    addressDetail: parsed.data.address_detail ?? null,
    memo: parsed.data.memo ?? null,
  }
}

// -----------------------------------------------------------------------------
// 조회
// -----------------------------------------------------------------------------

export async function getWorkspaces(): Promise<Workspace[]> {
  try {
    const accountId = await getAccountId()
    if (!accountId) return []
    const supabase = createClient()
    return await workspaceService.list(supabase, accountId)
  } catch {
    return []
  }
}

export async function getWorkspace(id: string): Promise<ActionResult<Workspace>> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const supabase = createClient()
    return workspaceService.getById(supabase, accountId, id)
  }, '워크스페이스 조회 중 오류가 발생했습니다.')
}

// -----------------------------------------------------------------------------
// 변경
// -----------------------------------------------------------------------------

export async function createWorkspace(
  formData: FormData
): Promise<ActionResult<Workspace>> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const supabase = createClient()
    await authService.requireActiveAccount(supabase, accountId)
    const input = parseWorkspaceInput(formData)
    const created = await workspaceService.create(supabase, accountId, input)
    revalidatePath(WORKSPACES_PATH)
    return created
  }, '워크스페이스 생성 중 오류가 발생했습니다.')
}

export async function updateWorkspace(
  id: string,
  formData: FormData
): Promise<ActionResult<Workspace>> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const input = parseWorkspaceInput(formData)
    const supabase = createClient()
    const updated = await workspaceService.update(supabase, accountId, id, input)
    revalidatePath(WORKSPACES_PATH)
    return updated
  }, '워크스페이스 수정 중 오류가 발생했습니다.')
}

export async function deleteWorkspace(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const supabase = createClient()
    await workspaceService.remove(supabase, accountId, id)
    revalidatePath(WORKSPACES_PATH)
    return undefined
  }, '워크스페이스 삭제 중 오류가 발생했습니다.')
}
