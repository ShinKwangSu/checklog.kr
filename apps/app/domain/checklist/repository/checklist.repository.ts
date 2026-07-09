// =============================================================================
// checklist 도메인 — repository (DB 접근)
// =============================================================================
// 규칙: 클라이언트 주입, account_id+workspace_id 이중 격리, 소프트 딜리트 필터,
// 인프라 에러 throw. 항목(checklist_items)의 diff 판단은 service 가 수행하고,
// repository 는 개별 원자 연산(삽입/수정/소프트삭제/조회)만 제공한다.
// =============================================================================

import type { Checklist, ChecklistWithItems, TypedSupabaseClient } from '@checklog/database'

type Db = TypedSupabaseClient

type Scope = { workspaceId: string; accountId: string }

type ItemRow = {
  checklistId: string
  workspaceId: string
  accountId: string
  itemName: string
  responseType: 'checklist' | 'photo'
  isRequired: boolean
  sortOrder: number
}

export const checklistRepository = {
  /** 워크스페이스 점검표 목록 (항목 포함, 항목 필터/정렬은 service) */
  async findByWorkspace(supabase: Db, scope: Scope): Promise<ChecklistWithItems[]> {
    const { data, error } = await supabase
      .from('checklists')
      .select(
        '*, checklist_items(id, item_name, response_type, is_required, sort_order, deleted_at)'
      )
      .eq('workspace_id', scope.workspaceId)
      .eq('account_id', scope.accountId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as unknown as ChecklistWithItems[]
  },

  /** 점검표 본체 생성 */
  async insertChecklist(
    supabase: Db,
    row: {
      accountId: string
      workspaceId: string
      checklistName: string
      description: string | null
      repeatCycle: 'daily' | 'weekly' | 'monthly'
      count: number
      days: number[] | null
    }
  ): Promise<Checklist> {
    const { data, error } = await supabase
      .from('checklists')
      .insert({
        account_id: row.accountId,
        workspace_id: row.workspaceId,
        checklist_name: row.checklistName,
        description: row.description,
        repeat_cycle: row.repeatCycle,
        count: row.count,
        days: row.days,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** 점검표 본체 수정 (격리 필터 + 미삭제 행) */
  async updateChecklist(
    supabase: Db,
    params: { id: string } & Scope,
    patch: {
      checklistName: string
      description: string | null
      repeatCycle: 'daily' | 'weekly' | 'monthly'
      count: number
      days: number[] | null
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('checklists')
      .update({
        checklist_name: patch.checklistName,
        description: patch.description,
        repeat_cycle: patch.repeatCycle,
        count: patch.count,
        days: patch.days,
      })
      .eq('id', params.id)
      .eq('workspace_id', params.workspaceId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)

    if (error) throw error
  },

  /** 점검표의 활성 항목 id 목록 */
  async findActiveItemIds(
    supabase: Db,
    params: { checklistId: string; accountId: string }
  ): Promise<string[]> {
    const { data, error } = await supabase
      .from('checklist_items')
      .select('id')
      .eq('checklist_id', params.checklistId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)

    if (error) throw error
    return (data ?? []).map((i) => i.id)
  },

  /** 여러 항목 삽입 */
  async insertItems(supabase: Db, rows: ItemRow[]): Promise<void> {
    if (rows.length === 0) return
    const { error } = await supabase.from('checklist_items').insert(
      rows.map((r) => ({
        checklist_id: r.checklistId,
        workspace_id: r.workspaceId,
        account_id: r.accountId,
        item_name: r.itemName,
        response_type: r.responseType,
        is_required: r.isRequired,
        sort_order: r.sortOrder,
      }))
    )
    if (error) throw error
  },

  /** 단일 항목 수정 */
  async updateItem(
    supabase: Db,
    params: {
      id: string
      accountId: string
      itemName: string
      responseType: 'checklist' | 'photo'
      isRequired: boolean
      sortOrder: number
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('checklist_items')
      .update({
        item_name: params.itemName,
        response_type: params.responseType,
        is_required: params.isRequired,
        sort_order: params.sortOrder,
      })
      .eq('id', params.id)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)

    if (error) throw error
  },

  /** 지정 항목 id 목록 소프트 딜리트 */
  async softDeleteItems(
    supabase: Db,
    params: { ids: string[]; accountId: string }
  ): Promise<void> {
    if (params.ids.length === 0) return
    const { error } = await supabase
      .from('checklist_items')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', params.ids)
      .eq('account_id', params.accountId)
    if (error) throw error
  },

  /** 점검표의 모든 활성 항목 소프트 딜리트 (점검표 삭제 cascade) */
  async softDeleteItemsByChecklist(
    supabase: Db,
    params: { checklistId: string; accountId: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('checklist_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('checklist_id', params.checklistId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)
    if (error) throw error
  },

  /** 점검표 본체 소프트 딜리트 */
  async softDeleteChecklist(supabase: Db, params: { id: string } & Scope): Promise<void> {
    const { error } = await supabase
      .from('checklists')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('workspace_id', params.workspaceId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)
    if (error) throw error
  },
}
