// =============================================================================
// workspace 도메인 — service (비즈니스 로직)
// =============================================================================
//
// 비즈니스 규칙:
//   ① min_floor 는 UI 에서 "지하 깊이 양수"로 들어오므로 저장 시 음수로 변환한다.
//   ② 삭제 시 하위 엔티티(시설/타입/점검자/점검표/항목) + 본체를 단일 트랜잭션
//      RPC(soft_delete_workspace, migration 017)로 원자적으로 cascade 소프트
//      딜리트한다.
// =============================================================================

import type { Workspace, TypedSupabaseClient } from '@checklog/database'
import { DomainError } from '@/lib/domain-error'
import { workspaceRepository } from '../repository/workspace.repository'
import type { WorkspaceWriteInput } from '../types'

type Db = TypedSupabaseClient

/** UI 양수 입력 → 저장 값(음수, 0=지하 없음) */
function toStoredMinFloor(minFloorInput: number): number {
  return minFloorInput > 0 ? -minFloorInput : minFloorInput
}

function toPatch(input: WorkspaceWriteInput) {
  return {
    workspaceName: input.workspaceName,
    maxFloor: input.maxFloor,
    minFloor: toStoredMinFloor(input.minFloorInput),
    address: input.address,
    addressDetail: input.addressDetail,
    memo: input.memo,
  }
}

export const workspaceService = {
  /** 고객 워크스페이스 목록 */
  async list(supabase: Db, accountId: string): Promise<Workspace[]> {
    return workspaceRepository.findAllByAccount(supabase, accountId)
  },

  /** 워크스페이스 단건 (없으면 DomainError) */
  async getById(supabase: Db, accountId: string, id: string): Promise<Workspace> {
    const workspace = await workspaceRepository.findById(supabase, { id, accountId })
    if (!workspace) throw new DomainError('워크스페이스를 찾을 수 없습니다.')
    return workspace
  },

  /** 워크스페이스 생성 */
  async create(
    supabase: Db,
    accountId: string,
    input: WorkspaceWriteInput
  ): Promise<Workspace> {
    return workspaceRepository.insert(supabase, { accountId, ...toPatch(input) })
  },

  /** 워크스페이스 수정 (없으면 DomainError) */
  async update(
    supabase: Db,
    accountId: string,
    id: string,
    input: WorkspaceWriteInput
  ): Promise<Workspace> {
    const updated = await workspaceRepository.update(supabase, { id, accountId }, toPatch(input))
    if (!updated) throw new DomainError('워크스페이스를 찾을 수 없습니다.')
    return updated
  },

  /** 워크스페이스 삭제 (하위 cascade + 본체, 단일 트랜잭션 RPC) */
  async remove(supabase: Db, accountId: string, id: string): Promise<void> {
    await workspaceRepository.softDeleteCascade(supabase, { workspaceId: id, accountId })
  },
}
