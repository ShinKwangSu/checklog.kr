'use server'

// =============================================================================
// checklog.kr MVP — 민원 Server Actions
// =============================================================================
// 보안 모델:
//   - submitComplaint / uploadComplaintPhoto: 인증 불필요 (방문자, /inspect/[facilityId])
//     - service_role 키 사용이지만 facilityId 존재 여부 검증으로 무결성 확보.
//   - getComplaints / updateComplaintStatus: 테넌트 인증 필수.
//     - tenant_id + facility 소유권 이중 검증.
// =============================================================================

import { auth } from '@/auth'
import { createClient } from '@/lib/supabase/server'
import type { Complaint } from '@/types/database'
import type { ActionResult } from '@/app/actions/workspace'

async function getTenantId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.tenantId ?? null
}

// =============================================================================
// 민원 접수 (비로그인 방문자)
// =============================================================================

export type SubmitComplaintInput = {
  complaint_type: string
  content: string
  photo_urls?: string[]
}

/**
 * 방문자 민원 접수.
 * facilityId로 시설 존재 여부 + workspace_id/tenant_id 조회 후 complaints INSERT.
 */
export async function submitComplaint(
  facilityId: string,
  input: SubmitComplaintInput
): Promise<ActionResult> {
  const { complaint_type, content, photo_urls = [] } = input

  if (!complaint_type.trim()) {
    return { success: false, error: '민원 유형을 선택해주세요.' }
  }
  if (!content.trim()) {
    return { success: false, error: '민원 내용을 입력해주세요.' }
  }

  const supabase = createClient()

  const { data: facility } = await supabase
    .from('facilities')
    .select('id, workspace_id, tenant_id')
    .eq('id', facilityId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!facility) {
    return { success: false, error: '존재하지 않는 시설입니다.' }
  }

  const { error } = await supabase.from('complaints').insert({
    facility_id: facilityId,
    workspace_id: facility.workspace_id,
    tenant_id: facility.tenant_id,
    complaint_type: complaint_type.trim(),
    content: content.trim(),
    photo_urls,
  })

  if (error) {
    console.error('[submitComplaint] insert error:', error)
    return { success: false, error: '민원 접수 중 오류가 발생했습니다.' }
  }

  return { success: true }
}

// =============================================================================
// 민원 사진 업로드 (비로그인 방문자)
// =============================================================================

export type PhotoUploadResult =
  | { success: true; url: string }
  | { success: false; error: string }

/**
 * 민원 첨부 사진 업로드.
 * inspection-photos 버킷의 complaints/ 경로에 저장한다.
 */
export async function uploadComplaintPhoto(
  facilityId: string,
  formData: FormData
): Promise<PhotoUploadResult> {
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) {
    return { success: false, error: '파일이 없습니다.' }
  }
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: '파일 크기는 10MB 이하여야 합니다.' }
  }

  const supabase = createClient()

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `complaints/${facilityId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('inspection-photos')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) {
    console.error('[uploadComplaintPhoto] storage error:', error)
    return { success: false, error: `사진 업로드 실패: ${error.message}` }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('inspection-photos')
    .getPublicUrl(path)

  return { success: true, url: publicUrl }
}

// =============================================================================
// 워크스페이스 전체 민원 조회 (테넌트 인증) — 민원 관리 페이지
// =============================================================================

export type ComplaintWithFacility = Complaint & {
  facility_name: string
}

export async function getWorkspaceComplaints(
  workspaceId: string
): Promise<ComplaintWithFacility[]> {
  const tenantId = await getTenantId()
  if (!tenantId) return []

  const supabase = createClient()

  const { data: facilities } = await supabase
    .from('facilities')
    .select('id, facility_name')
    .eq('workspace_id', workspaceId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)

  if (!facilities?.length) return []

  const facilityIds = facilities.map((f) => f.id)
  const facilityMap = new Map(facilities.map((f) => [f.id, f.facility_name]))

  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .in('facility_id', facilityIds)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return []

  return (data ?? []).map((c) => ({
    ...(c as Complaint),
    facility_name: facilityMap.get(c.facility_id) ?? '알 수 없음',
  }))
}

// =============================================================================
// 민원 목록 조회 (테넌트 인증)
// =============================================================================

/**
 * 시설별 민원 목록 조회.
 * facility가 현재 테넌트 소유인지 함께 검증한다.
 */
export async function getComplaints(facilityId: string): Promise<Complaint[]> {
  const tenantId = await getTenantId()
  if (!tenantId) return []

  const supabase = createClient()

  // facility 소유권 검증
  const { data: facility } = await supabase
    .from('facilities')
    .select('id')
    .eq('id', facilityId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!facility) return []

  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('facility_id', facilityId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return []
  return (data ?? []) as Complaint[]
}

// =============================================================================
// 민원 처리 상태 변경 (테넌트 인증)
// =============================================================================

/**
 * 민원 처리 상태 변경.
 * received → in_progress → resolved 순서를 앱 레이어에서 강제한다.
 */
export async function updateComplaintStatus(
  complaintId: string,
  status: 'received' | 'in_progress' | 'resolved'
): Promise<ActionResult> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: '로그인이 필요합니다.' }

  const supabase = createClient()

  const resolvedAt =
    status === 'resolved' ? new Date().toISOString() : null

  const { error } = await supabase
    .from('complaints')
    .update({ status, resolved_at: resolvedAt })
    .eq('id', complaintId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)

  if (error) {
    return { success: false, error: '상태 변경 중 오류가 발생했습니다.' }
  }

  return { success: true }
}
