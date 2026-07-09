// =============================================================================
// checklist 도메인 — service (비즈니스 로직)
// =============================================================================
//
// 점검표는 항목(items)을 포함하는 복합 애그리거트다. 핵심 비즈니스 규칙:
//   ① days 는 repeat_cycle 이 'weekly' 일 때만 유효하며, 그 외에는 null 로 정규화한다.
//   ② 수정 시 폼 항목과 기존 활성 항목을 대조해 삭제/수정/삽입으로 분기한다.
//      - 폼에서 사라진 기존 항목 → 소프트 딜리트
//      - id 가 있는 항목 → 수정(UUID 유지)
//      - id 가 없는 항목 → 신규 삽입
//   ③ 삭제 시 하위 항목을 먼저 소프트 딜리트한 뒤 본체를 소프트 딜리트한다.
//      (코드 레벨 cascade — DB CASCADE 는 하드 딜리트 전용)
// =============================================================================

import type { ChecklistWithItems, TypedSupabaseClient } from '@checklog/database'
import { checklistRepository } from '../repository/checklist.repository'
import type { ChecklistWriteInput } from '../types'

type Db = TypedSupabaseClient

/** repeat_cycle 에 따라 days 를 정규화한다(weekly 만 유효). */
function normalizeDays(input: ChecklistWriteInput): number[] | null {
  return input.repeatCycle === 'weekly' ? (input.days ?? []) : null
}

export const checklistService = {
  /** 워크스페이스 점검표 목록 (삭제 항목 제외 + sort_order 정렬) */
  async listByWorkspace(
    supabase: Db,
    accountId: string,
    workspaceId: string
  ): Promise<ChecklistWithItems[]> {
    const rows = await checklistRepository.findByWorkspace(supabase, { workspaceId, accountId })
    return rows.map((c) => ({
      ...c,
      checklist_items: [...(c.checklist_items ?? [])]
        .filter((item) => item.deleted_at === null || item.deleted_at === undefined)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
  },

  /** 점검표 생성 (본체 + 항목 일괄 삽입) */
  async create(
    supabase: Db,
    accountId: string,
    workspaceId: string,
    input: ChecklistWriteInput
  ): Promise<void> {
    const checklist = await checklistRepository.insertChecklist(supabase, {
      accountId,
      workspaceId,
      checklistName: input.checklistName,
      description: input.description,
      repeatCycle: input.repeatCycle,
      count: input.count,
      days: normalizeDays(input),
    })

    await checklistRepository.insertItems(
      supabase,
      input.items.map((item, idx) => ({
        checklistId: checklist.id,
        workspaceId,
        accountId,
        itemName: item.itemName,
        responseType: item.responseType,
        isRequired: item.isRequired,
        sortOrder: idx,
      }))
    )
  },

  /** 점검표 수정 (본체 수정 + 항목 diff 반영) */
  async update(
    supabase: Db,
    accountId: string,
    workspaceId: string,
    id: string,
    input: ChecklistWriteInput
  ): Promise<void> {
    await checklistRepository.updateChecklist(
      supabase,
      { id, workspaceId, accountId },
      {
        checklistName: input.checklistName,
        description: input.description,
        repeatCycle: input.repeatCycle,
        count: input.count,
        days: normalizeDays(input),
      }
    )

    const existingIds = await checklistRepository.findActiveItemIds(supabase, {
      checklistId: id,
      accountId,
    })
    const existingSet = new Set(existingIds)
    const formIds = new Set(input.items.filter((i) => i.id).map((i) => i.id as string))

    // 폼에서 제거된 기존 항목 → 소프트 딜리트
    const toDelete = existingIds.filter((eid) => !formIds.has(eid))
    await checklistRepository.softDeleteItems(supabase, { ids: toDelete, accountId })

    // id 가 있고 기존에 존재하는 항목 → 수정 (sort_order 는 폼 순서)
    const toUpdate = input.items.filter((i) => i.id && existingSet.has(i.id))
    await Promise.all(
      toUpdate.map((item) =>
        checklistRepository.updateItem(supabase, {
          id: item.id as string,
          accountId,
          itemName: item.itemName,
          responseType: item.responseType,
          isRequired: item.isRequired,
          sortOrder: input.items.indexOf(item),
        })
      )
    )

    // id 가 없는 항목 → 신규 삽입
    const toInsert = input.items.filter((i) => !i.id)
    await checklistRepository.insertItems(
      supabase,
      toInsert.map((item) => ({
        checklistId: id,
        workspaceId,
        accountId,
        itemName: item.itemName,
        responseType: item.responseType,
        isRequired: item.isRequired,
        sortOrder: input.items.indexOf(item),
      }))
    )
  },

  /** 점검표 삭제 (하위 항목 → 본체 순 소프트 딜리트) */
  async remove(
    supabase: Db,
    accountId: string,
    workspaceId: string,
    id: string
  ): Promise<void> {
    await checklistRepository.softDeleteItemsByChecklist(supabase, {
      checklistId: id,
      accountId,
    })
    await checklistRepository.softDeleteChecklist(supabase, { id, workspaceId, accountId })
  },
}
