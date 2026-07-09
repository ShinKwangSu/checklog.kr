// =============================================================================
// inspection 도메인 — repository (DB / Storage 접근)
// =============================================================================
// 규칙: 클라이언트 주입, 인프라 에러 throw. 세션 유효성(status='active' AND
// expires_at > now)은 DB where 절에서 판단한다. 점검 흐름 대부분은 비로그인(anon)
// 경로라 account 스코프가 없고, 세션 id(추측 불가 UUID)와 시설 존재로 무결성을 확보한다.
// 워크스페이스 이력만 account_id 로 격리한다.
// =============================================================================

import type {
  InspectionSession,
  ChecklistItem,
  Facility,
  TypedSupabaseClient,
} from '@checklog/database'

type Db = TypedSupabaseClient

export type ItemResults = Record<string, boolean | string>

type SessionRow = {
  id: string
  completed_at: string | null
  inspector_id: string | null
}

type ResultRow = {
  session_id: string
  submitted_at: string
  item_results: ItemResults
}

type InspectorRow = { id: string; name: string | null; phone: string | null }

export const inspectionRepository = {
  // ---------------------------------------------------------------------------
  // 세션 조회/생성
  // ---------------------------------------------------------------------------

  /** 활성 + 미만료 세션 전체 조회 */
  async findActiveSession(
    supabase: Db,
    params: { sessionId: string; facilityId: string }
  ): Promise<InspectionSession | null> {
    const { data, error } = await supabase
      .from('inspection_sessions')
      .select('*')
      .eq('id', params.sessionId)
      .eq('facility_id', params.facilityId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (error) throw error
    return (data as InspectionSession | null) ?? null
  },

  /** 활성 + 미만료 세션 존재 여부(id 만) */
  async findActiveSessionId(
    supabase: Db,
    params: { sessionId: string; facilityId: string }
  ): Promise<{ id: string } | null> {
    const { data, error } = await supabase
      .from('inspection_sessions')
      .select('id')
      .eq('id', params.sessionId)
      .eq('facility_id', params.facilityId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (error) throw error
    return data ?? null
  },

  /** 세션 상태만 조회(만료/완료 구분용) */
  async findSessionStatus(
    supabase: Db,
    params: { sessionId: string; facilityId: string }
  ): Promise<{ status: string } | null> {
    const { data, error } = await supabase
      .from('inspection_sessions')
      .select('status')
      .eq('id', params.sessionId)
      .eq('facility_id', params.facilityId)
      .maybeSingle()

    if (error) throw error
    return data ?? null
  },

  /** 완료 세션 단건(이력 상세) */
  async findCompletedSession(
    supabase: Db,
    params: { sessionId: string; facilityId: string }
  ): Promise<SessionRow | null> {
    const { data, error } = await supabase
      .from('inspection_sessions')
      .select('id, completed_at, inspector_id')
      .eq('id', params.sessionId)
      .eq('facility_id', params.facilityId)
      .eq('status', 'completed')
      .maybeSingle()

    if (error) throw error
    return data ?? null
  },

  /** 시설의 완료 세션 목록(최신순, 상한) */
  async findCompletedSessions(
    supabase: Db,
    params: { facilityId: string; limit: number }
  ): Promise<SessionRow[]> {
    const { data, error } = await supabase
      .from('inspection_sessions')
      .select('id, completed_at, inspector_id')
      .eq('facility_id', params.facilityId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(params.limit)

    if (error) throw error
    return data ?? []
  },

  /** 여러 시설의 완료 세션 목록(facility_id 포함, 최신순, 상한) */
  async findCompletedSessionsByFacilities(
    supabase: Db,
    params: { facilityIds: string[]; limit: number }
  ): Promise<(SessionRow & { facility_id: string })[]> {
    const { data, error } = await supabase
      .from('inspection_sessions')
      .select('id, completed_at, inspector_id, facility_id')
      .in('facility_id', params.facilityIds)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(params.limit)

    if (error) throw error
    return data ?? []
  },

  /** 세션 생성(active) */
  async createSession(
    supabase: Db,
    params: { facilityId: string; inspectorId: string }
  ): Promise<{ id: string } | null> {
    const { data, error } = await supabase
      .from('inspection_sessions')
      .insert({ facility_id: params.facilityId, inspector_id: params.inspectorId })
      .select()
      .single()

    // 생성 실패는 흐름상 reason='session_error' 로 처리되므로 null 반환(throw 아님)
    if (error) return null
    return data
  },

  /** 세션 완료 처리 */
  async completeSession(supabase: Db, sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('inspection_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    if (error) throw error
  },

  // ---------------------------------------------------------------------------
  // 결과
  // ---------------------------------------------------------------------------

  /** 점검 결과 INSERT */
  async insertResult(
    supabase: Db,
    params: { sessionId: string; facilityId: string; itemResults: ItemResults }
  ): Promise<void> {
    const { error } = await supabase
      .from('inspection_results')
      .insert({
        session_id: params.sessionId,
        facility_id: params.facilityId,
        item_results: params.itemResults,
      })

    if (error) throw error
  },

  /** 세션 id 목록의 결과 조회 */
  async findResultsBySessionIds(supabase: Db, sessionIds: string[]): Promise<ResultRow[]> {
    if (sessionIds.length === 0) return []
    const { data, error } = await supabase
      .from('inspection_results')
      .select('session_id, submitted_at, item_results')
      .in('session_id', sessionIds)

    if (error) throw error
    return (data ?? []) as ResultRow[]
  },

  /** 단일 세션 결과 */
  async findResultBySession(
    supabase: Db,
    sessionId: string
  ): Promise<{ submitted_at: string; item_results: ItemResults } | null> {
    const { data, error } = await supabase
      .from('inspection_results')
      .select('submitted_at, item_results')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (error) throw error
    return (data as { submitted_at: string; item_results: ItemResults } | null) ?? null
  },

  /** 시설 마지막 점검 시각 */
  async findLastInspectionAt(supabase: Db, facilityId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('inspection_results')
      .select('submitted_at')
      .eq('facility_id', facilityId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data?.submitted_at ?? null
  },

  /** 특정 시각 이후 결과 건수 */
  async countResultsSince(
    supabase: Db,
    params: { facilityId: string; since: string }
  ): Promise<number> {
    const { count, error } = await supabase
      .from('inspection_results')
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', params.facilityId)
      .gte('submitted_at', params.since)

    if (error) throw error
    return count ?? 0
  },

  // ---------------------------------------------------------------------------
  // 시설 / 점검표 / 점검자
  // ---------------------------------------------------------------------------

  /** 시설 단건(활성) */
  async findFacility(supabase: Db, facilityId: string): Promise<Facility | null> {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', facilityId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return (data as Facility | null) ?? null
  },

  /** 시설 단건(검증용, id + workspace_id) */
  async findFacilityForVerify(
    supabase: Db,
    facilityId: string
  ): Promise<{ id: string; workspace_id: string } | null> {
    const { data, error } = await supabase
      .from('facilities')
      .select('id, workspace_id')
      .eq('id', facilityId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return data ?? null
  },

  /** 워크스페이스의 (활성) 시설 id/이름 목록 (account 격리) */
  async findWorkspaceFacilities(
    supabase: Db,
    params: { workspaceId: string; accountId: string }
  ): Promise<{ id: string; facility_name: string }[]> {
    const { data, error } = await supabase
      .from('facilities')
      .select('id, facility_name')
      .eq('workspace_id', params.workspaceId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)

    if (error) throw error
    return data ?? []
  },

  /** 시설에 연결된 점검표 id */
  async findFacilityChecklistId(supabase: Db, facilityId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('facility_checklists')
      .select('checklist_id')
      .eq('facility_id', facilityId)
      .maybeSingle()

    if (error) throw error
    return data?.checklist_id ?? null
  },

  /** 점검표 항목 목록. includeDeleted=true 면 삭제 항목도 포함(이력 표시용) */
  async findChecklistItems(
    supabase: Db,
    params: { checklistId: string; includeDeleted?: boolean }
  ): Promise<ChecklistItem[]> {
    let query = supabase
      .from('checklist_items')
      .select(
        params.includeDeleted
          ? 'id, item_name, response_type, is_required, sort_order, deleted_at'
          : '*'
      )
      .eq('checklist_id', params.checklistId)

    if (!params.includeDeleted) query = query.is('deleted_at', null)

    const { data, error } = await query.order('sort_order', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as ChecklistItem[]
  },

  /** 워크스페이스 내에서 전화번호 뒤 4자리로 활성 점검자 조회 */
  async findInspectorByPhoneLast4(
    supabase: Db,
    params: { workspaceId: string; phoneLast4: string }
  ): Promise<{ id: string } | null> {
    const { data, error } = await supabase
      .from('inspectors')
      .select('id')
      .eq('workspace_id', params.workspaceId)
      .is('deleted_at', null)
      .like('phone', `%${params.phoneLast4}`)
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data ?? null
  },

  /** 점검자 id 목록 조회 */
  async findInspectorsByIds(supabase: Db, ids: string[]): Promise<InspectorRow[]> {
    if (ids.length === 0) return []
    const { data, error } = await supabase
      .from('inspectors')
      .select('id, name, phone')
      .in('id', ids)

    if (error) throw error
    return data ?? []
  },

  /** 점검자 단건 조회 */
  async findInspectorById(
    supabase: Db,
    id: string
  ): Promise<{ name: string | null; phone: string | null } | null> {
    const { data, error } = await supabase
      .from('inspectors')
      .select('name, phone')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ?? null
  },

  // ---------------------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------------------

  /** 점검 사진 업로드(upsert) 후 공개 URL */
  async uploadPhoto(
    supabase: Db,
    params: { path: string; file: File }
  ): Promise<string> {
    const { error } = await supabase.storage
      .from('inspection-photos')
      .upload(params.path, params.file, {
        contentType: params.file.type,
        upsert: true,
      })
    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from('inspection-photos').getPublicUrl(params.path)
    return publicUrl
  },
}
