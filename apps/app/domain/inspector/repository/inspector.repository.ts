// =============================================================================
// inspector 도메인 — repository (DB 접근)
// =============================================================================
// 규칙: 클라이언트 주입, account_id+workspace_id 이중 격리, 소프트 딜리트 필터,
// 인프라 에러 throw.
// =============================================================================

import type { Inspector, TypedSupabaseClient } from '@checklog/database'

type Db = TypedSupabaseClient

type Scope = { workspaceId: string; accountId: string }

export const inspectorRepository = {
  /** 워크스페이스 점검자 목록 (생성순) */
  async findByWorkspace(supabase: Db, scope: Scope): Promise<Inspector[]> {
    const { data, error } = await supabase
      .from('inspectors')
      .select('*')
      .eq('workspace_id', scope.workspaceId)
      .eq('account_id', scope.accountId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  /** 점검자 생성 */
  async insert(
    supabase: Db,
    row: { accountId: string; workspaceId: string; name: string; phone: string | null; email: string | null }
  ): Promise<Inspector> {
    const { data, error } = await supabase
      .from('inspectors')
      .insert({
        account_id: row.accountId,
        workspace_id: row.workspaceId,
        name: row.name,
        phone: row.phone,
        email: row.email,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** 점검자 수정. 대상 없으면 null */
  async update(
    supabase: Db,
    params: { id: string } & Scope,
    patch: { name: string; phone: string | null; email: string | null }
  ): Promise<Inspector | null> {
    const { data, error } = await supabase
      .from('inspectors')
      .update({ name: patch.name, phone: patch.phone, email: patch.email })
      .eq('id', params.id)
      .eq('workspace_id', params.workspaceId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)
      .select()
      .maybeSingle()

    if (error) throw error
    return data ?? null
  },

  /** 소프트 딜리트 */
  async softDelete(supabase: Db, params: { id: string } & Scope): Promise<void> {
    const { error } = await supabase
      .from('inspectors')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('workspace_id', params.workspaceId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)

    if (error) throw error
  },
}
