// =============================================================================
// complaint 도메인 — repository (DB / Storage 접근)
// =============================================================================
// 규칙: 클라이언트 주입, 인프라 에러 throw.
//
// 격리 주의: 민원 접수/사진 업로드는 비로그인(anon) 경로라 account_id 스코프가
// 없다. 대신 facilityId 존재 검증(findFacilityForSubmit)으로 무결성을 확보한다.
// 조회/상태변경은 account_id 로 격리한다.
// =============================================================================

import type { Complaint, TypedSupabaseClient } from '@checklog/database'
import type { ComplaintStatus } from '../types'

type Db = TypedSupabaseClient

const PHOTO_BUCKET = 'inspection-photos'

export const complaintRepository = {
  // ---------------------------------------------------------------------------
  // 비로그인 경로 (anon)
  // ---------------------------------------------------------------------------

  /** 접수 대상 시설 조회 (account 스코프 없음 — 존재/미삭제만 확인) */
  async findFacilityForSubmit(
    supabase: Db,
    facilityId: string
  ): Promise<{ id: string; workspace_id: string; account_id: string } | null> {
    const { data, error } = await supabase
      .from('facilities')
      .select('id, workspace_id, account_id')
      .eq('id', facilityId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return data ?? null
  },

  /** 민원 INSERT (account_id/workspace_id 는 시설에서 파생) */
  async insertComplaint(
    supabase: Db,
    row: {
      facilityId: string
      workspaceId: string
      accountId: string
      complaintType: string
      content: string
      photoUrls: string[]
    }
  ): Promise<void> {
    const { error } = await supabase.from('complaints').insert({
      facility_id: row.facilityId,
      workspace_id: row.workspaceId,
      account_id: row.accountId,
      complaint_type: row.complaintType,
      content: row.content,
      photo_urls: row.photoUrls,
    })
    if (error) throw error
  },

  /** 사진 업로드 후 공개 URL 반환 */
  async uploadPhoto(
    supabase: Db,
    params: { path: string; file: File }
  ): Promise<string> {
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(params.path, params.file, {
        contentType: params.file.type,
        upsert: false,
      })
    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(params.path)
    return publicUrl
  },

  // ---------------------------------------------------------------------------
  // 인증 경로 (고객)
  // ---------------------------------------------------------------------------

  /** 워크스페이스의 (활성) 시설 id/이름 목록 */
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

  /** 여러 시설의 민원 목록 (최신순, 상한) */
  async findByFacilityIds(
    supabase: Db,
    params: { facilityIds: string[]; accountId: string; limit: number }
  ): Promise<Complaint[]> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .in('facility_id', params.facilityIds)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(params.limit)

    if (error) throw error
    return (data ?? []) as Complaint[]
  },

  /** 시설이 지정 고객 소유이며 활성인지 확인 */
  async isFacilityOwned(
    supabase: Db,
    params: { facilityId: string; accountId: string }
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('facilities')
      .select('id')
      .eq('id', params.facilityId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return !!data
  },

  /** 단일 시설의 민원 목록 (최신순, 상한) */
  async findByFacility(
    supabase: Db,
    params: { facilityId: string; accountId: string; limit: number }
  ): Promise<Complaint[]> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('facility_id', params.facilityId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(params.limit)

    if (error) throw error
    return (data ?? []) as Complaint[]
  },

  /** 민원 상태 변경 (account 격리) */
  async updateStatus(
    supabase: Db,
    params: { complaintId: string; accountId: string; status: ComplaintStatus; resolvedAt: string | null }
  ): Promise<void> {
    const { error } = await supabase
      .from('complaints')
      .update({ status: params.status, resolved_at: params.resolvedAt })
      .eq('id', params.complaintId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)

    if (error) throw error
  },
}
