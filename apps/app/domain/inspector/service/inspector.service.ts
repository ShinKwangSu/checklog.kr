// =============================================================================
// inspector 도메인 — service (비즈니스 로직)
// =============================================================================
// 특별한 비즈니스 규칙 없이 격리 스코프를 유지하며 repository 를 오케스트레이션한다.
// =============================================================================

import type { Inspector, TypedSupabaseClient } from '@checklog/database'
import { DomainError } from '@/lib/domain-error'
import { inspectorRepository } from '../repository/inspector.repository'
import type { InspectorWriteInput } from '../types'

type Db = TypedSupabaseClient

export const inspectorService = {
  async listByWorkspace(
    supabase: Db,
    accountId: string,
    workspaceId: string
  ): Promise<Inspector[]> {
    return inspectorRepository.findByWorkspace(supabase, { workspaceId, accountId })
  },

  async create(
    supabase: Db,
    accountId: string,
    workspaceId: string,
    input: InspectorWriteInput
  ): Promise<Inspector> {
    return inspectorRepository.insert(supabase, {
      accountId,
      workspaceId,
      name: input.name,
      phone: input.phone,
      email: input.email,
    })
  },

  async update(
    supabase: Db,
    accountId: string,
    workspaceId: string,
    id: string,
    input: InspectorWriteInput
  ): Promise<Inspector> {
    const updated = await inspectorRepository.update(
      supabase,
      { id, workspaceId, accountId },
      { name: input.name, phone: input.phone, email: input.email }
    )
    if (!updated) throw new DomainError('점검자를 찾을 수 없습니다.')
    return updated
  },

  async remove(
    supabase: Db,
    accountId: string,
    workspaceId: string,
    id: string
  ): Promise<void> {
    await inspectorRepository.softDelete(supabase, { id, workspaceId, accountId })
  },
}
