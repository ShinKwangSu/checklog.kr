// =============================================================================
// facility 도메인 — repository (DB 접근)
// =============================================================================
//
// 규칙:
// - Supabase 클라이언트를 인자로 주입받는다. 내부에서 직접 생성하지 않는다.
// - 멀티고객 격리: 모든 쿼리에 account_id 를 필터한다. 시설 스코프 쿼리는
//   workspace_id 까지 이중 필터한다(service_role 이 RLS 를 우회하므로 코드 레벨
//   필터가 실질 격리선).
// - 소프트 딜리트: 모든 SELECT/UPDATE 에 .is('deleted_at', null) 필터. 삭제는
//   deleted_at 업데이트. facility_checklists 는 조인 테이블이라 하드 딜리트 유지.
// - 인프라 에러는 throw 한다(service/runAction 에서 의미 변환·마스킹).
// =============================================================================

import type { Facility, FacilityWithChecklists, TypedSupabaseClient } from '@checklog/database'

type Db = TypedSupabaseClient

type Scope = { workspaceId: string; accountId: string }

export const facilityRepository = {
  /** 워크스페이스 시설 목록 (점검표 연결 포함, 층 내림차순 → 생성순) */
  async findByWorkspace(
    supabase: Db,
    scope: Scope
  ): Promise<FacilityWithChecklists[]> {
    const { data, error } = await supabase
      .from('facilities')
      .select('*, facility_checklists(checklist_id)')
      .eq('workspace_id', scope.workspaceId)
      .eq('account_id', scope.accountId)
      .is('deleted_at', null)
      .order('floor', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []) as unknown as FacilityWithChecklists[]
  },

  /** 단건 조회 (수정 폼 프리필용) */
  async findById(
    supabase: Db,
    params: { id: string; accountId: string }
  ): Promise<Facility | null> {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', params.id)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return data ?? null
  },

  /** 워크스페이스 층수 범위 조회 (층 유효성 검증용) */
  async findWorkspaceFloorRange(
    supabase: Db,
    scope: Scope
  ): Promise<{ min_floor: number; max_floor: number } | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('min_floor, max_floor')
      .eq('id', scope.workspaceId)
      .eq('account_id', scope.accountId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return data ?? null
  },

  /** 시설 타입이 지정 워크스페이스/고객 소속인지 확인 */
  async isFacilityTypeOwned(
    supabase: Db,
    params: { facilityTypeId: string } & Scope
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('facility_types')
      .select('id')
      .eq('id', params.facilityTypeId)
      .eq('workspace_id', params.workspaceId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return !!data
  },

  /** 시설 생성 */
  async insert(
    supabase: Db,
    row: {
      accountId: string
      workspaceId: string
      facilityTypeId: string
      facilityName: string
      floor: number
      memo: string | null
    }
  ): Promise<Facility> {
    const { data, error } = await supabase
      .from('facilities')
      .insert({
        account_id: row.accountId,
        workspace_id: row.workspaceId,
        facility_type_id: row.facilityTypeId,
        facility_name: row.facilityName,
        floor: row.floor,
        memo: row.memo,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /** 시설 수정 — 격리 필터 통과 + 미삭제 행만. 대상 없으면 null */
  async update(
    supabase: Db,
    params: { id: string } & Scope,
    patch: { facilityTypeId: string; facilityName: string; floor: number; memo: string | null }
  ): Promise<Facility | null> {
    const { data, error } = await supabase
      .from('facilities')
      .update({
        facility_type_id: patch.facilityTypeId,
        facility_name: patch.facilityName,
        floor: patch.floor,
        memo: patch.memo,
      })
      .eq('id', params.id)
      .eq('workspace_id', params.workspaceId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)
      .select()
      .maybeSingle()

    if (error) throw error
    return data ?? null
  },

  /** 소프트 딜리트 (deleted_at 업데이트) */
  async softDelete(supabase: Db, params: { id: string } & Scope): Promise<void> {
    const { error } = await supabase
      .from('facilities')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('workspace_id', params.workspaceId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)

    if (error) throw error
  },

  /**
   * 시설-점검표 연결을 전체 교체한다(삭제 후 재삽입).
   * facility_checklists 는 조인 테이블이라 하드 딜리트 대상이다.
   * checklistId 가 null 이면 연결을 모두 제거만 한다.
   */
  async replaceChecklistLink(
    supabase: Db,
    params: { facilityId: string; checklistId: string | null } & Scope
  ): Promise<void> {
    const { error: delError } = await supabase
      .from('facility_checklists')
      .delete()
      .eq('facility_id', params.facilityId)
      .eq('account_id', params.accountId)

    if (delError) throw delError

    if (params.checklistId) {
      const { error: insError } = await supabase.from('facility_checklists').insert({
        facility_id: params.facilityId,
        checklist_id: params.checklistId,
        workspace_id: params.workspaceId,
        account_id: params.accountId,
      })
      if (insError) throw insError
    }
  },
}
