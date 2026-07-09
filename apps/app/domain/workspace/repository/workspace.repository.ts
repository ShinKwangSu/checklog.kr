// =============================================================================
// workspace 도메인 — repository (DB 접근)
// =============================================================================
// 규칙: 클라이언트 주입, account_id 격리(워크스페이스가 격리 최상위이므로
// workspace_id 스코프는 없음), 소프트 딜리트 필터, 인프라 에러 throw.
// =============================================================================

import type { Workspace, TypedSupabaseClient } from '@checklog/database'

type Db = TypedSupabaseClient

/** 저장용 워크스페이스 컬럼 패치(음수 변환 등은 service 에서 완료된 상태) */
type WorkspacePatch = {
  workspaceName: string
  maxFloor: number
  minFloor: number
  address: string | null
  addressDetail: string | null
  memo: string | null
}

function toRow(patch: WorkspacePatch) {
  return {
    workspace_name: patch.workspaceName,
    max_floor: patch.maxFloor,
    min_floor: patch.minFloor,
    address: patch.address,
    address_detail: patch.addressDetail,
    memo: patch.memo,
  }
}

export const workspaceRepository = {
  /** 고객의 워크스페이스 목록 (최신순) */
  async findAllByAccount(supabase: Db, accountId: string): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('account_id', accountId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  /** 워크스페이스 단건 */
  async findById(
    supabase: Db,
    params: { id: string; accountId: string }
  ): Promise<Workspace | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', params.id)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return data ?? null
  },

  /** 워크스페이스 생성 */
  async insert(
    supabase: Db,
    params: { accountId: string } & WorkspacePatch
  ): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ account_id: params.accountId, ...toRow(params) })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** 워크스페이스 수정. 대상 없으면 null */
  async update(
    supabase: Db,
    params: { id: string; accountId: string },
    patch: WorkspacePatch
  ): Promise<Workspace | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .update(toRow(patch))
      .eq('id', params.id)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)
      .select()
      .maybeSingle()

    if (error) throw error
    return data ?? null
  },

  /**
   * 하위 엔티티 cascade 소프트 딜리트(코드 레벨).
   * facility_types, facilities, inspectors, checklists, checklist_items 를
   * 워크스페이스+고객 스코프로 일괄 soft delete 한다.
   *
   * NOTE: 개별 UPDATE 가 각각 커밋되므로 원자적이지 않다(부분 삭제 위험). account
   * 삭제(016 soft_delete_account RPC)처럼 트랜잭션 함수로 옮기는 것이 정합성상 바람직하다.
   */
  async softDeleteChildren(
    supabase: Db,
    params: { workspaceId: string; accountId: string }
  ): Promise<void> {
    const now = new Date().toISOString()
    const tables = [
      'checklist_items',
      'facilities',
      'facility_types',
      'inspectors',
      'checklists',
    ] as const

    const results = await Promise.all(
      tables.map((table) =>
        supabase
          .from(table)
          .update({ deleted_at: now })
          .eq('workspace_id', params.workspaceId)
          .eq('account_id', params.accountId)
          .is('deleted_at', null)
      )
    )

    const failed = results.find((r) => r.error)
    if (failed?.error) throw failed.error
  },

  /** 워크스페이스 본체 소프트 딜리트 */
  async softDelete(
    supabase: Db,
    params: { id: string; accountId: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('workspaces')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)

    if (error) throw error
  },
}
