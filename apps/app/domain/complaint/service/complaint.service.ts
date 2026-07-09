// =============================================================================
// complaint 도메인 — service (비즈니스 로직)
// =============================================================================
//
// 보안 경계:
//   - submit/uploadPhoto: 비로그인 경로. facilityId 존재 검증으로 무결성 확보.
//   - list*/changeStatus: 고객 인증 경로. account_id 격리 + 시설 소유권 검증.
//
// 비즈니스 규칙:
//   - 접수: 민원 유형/내용은 공백 불가.
//   - 사진: 파일 존재 + 10MB 이하.
//   - 상태 변경: resolved 로 바뀔 때 resolved_at 을 기록한다.
// =============================================================================

import type { TypedSupabaseClient } from '@checklog/database'
import { DomainError } from '@/lib/domain-error'
import { complaintRepository } from '../repository/complaint.repository'
import type {
  Complaint,
  ComplaintStatus,
  ComplaintWithFacility,
  SubmitComplaintInput,
} from '../types'

type Db = TypedSupabaseClient

const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const WORKSPACE_COMPLAINTS_LIMIT = 200
const FACILITY_COMPLAINTS_LIMIT = 100

export const complaintService = {
  // ---------------------------------------------------------------------------
  // 비로그인 경로
  // ---------------------------------------------------------------------------

  /** 방문자 민원 접수 */
  async submit(
    supabase: Db,
    facilityId: string,
    input: SubmitComplaintInput
  ): Promise<void> {
    const complaintType = input.complaint_type.trim()
    const content = input.content.trim()
    if (!complaintType) throw new DomainError('민원 유형을 선택해주세요.')
    if (!content) throw new DomainError('민원 내용을 입력해주세요.')

    const facility = await complaintRepository.findFacilityForSubmit(supabase, facilityId)
    if (!facility) throw new DomainError('존재하지 않는 시설입니다.')

    await complaintRepository.insertComplaint(supabase, {
      facilityId,
      workspaceId: facility.workspace_id,
      accountId: facility.account_id,
      complaintType,
      content,
      photoUrls: input.photo_urls ?? [],
    })
  },

  /** 민원 첨부 사진 업로드 → 공개 URL */
  async uploadPhoto(
    supabase: Db,
    facilityId: string,
    file: File | null,
    key: string
  ): Promise<string> {
    if (!file || file.size === 0) throw new DomainError('파일이 없습니다.')
    if (file.size > MAX_PHOTO_BYTES) {
      throw new DomainError('파일 크기는 10MB 이하여야 합니다.')
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `complaints/${facilityId}/${key}.${ext}`
    return complaintRepository.uploadPhoto(supabase, { path, file })
  },

  // ---------------------------------------------------------------------------
  // 인증 경로
  // ---------------------------------------------------------------------------

  /** 워크스페이스 전체 민원 (시설명 포함) */
  async listWorkspaceComplaints(
    supabase: Db,
    accountId: string,
    workspaceId: string
  ): Promise<ComplaintWithFacility[]> {
    const facilities = await complaintRepository.findWorkspaceFacilities(supabase, {
      workspaceId,
      accountId,
    })
    if (facilities.length === 0) return []

    const facilityMap = new Map(facilities.map((f) => [f.id, f.facility_name]))
    const complaints = await complaintRepository.findByFacilityIds(supabase, {
      facilityIds: facilities.map((f) => f.id),
      accountId,
      limit: WORKSPACE_COMPLAINTS_LIMIT,
    })

    return complaints.map((c) => ({
      ...c,
      facility_name: facilityMap.get(c.facility_id) ?? '알 수 없음',
    }))
  },

  /** 시설별 민원 목록 (소유권 검증, 미소유 시 빈 목록) */
  async listByFacility(
    supabase: Db,
    accountId: string,
    facilityId: string
  ): Promise<Complaint[]> {
    const owned = await complaintRepository.isFacilityOwned(supabase, { facilityId, accountId })
    if (!owned) return []

    return complaintRepository.findByFacility(supabase, {
      facilityId,
      accountId,
      limit: FACILITY_COMPLAINTS_LIMIT,
    })
  },

  /** 민원 처리 상태 변경 */
  async changeStatus(
    supabase: Db,
    accountId: string,
    complaintId: string,
    status: ComplaintStatus
  ): Promise<void> {
    const resolvedAt = status === 'resolved' ? new Date().toISOString() : null
    await complaintRepository.updateStatus(supabase, {
      complaintId,
      accountId,
      status,
      resolvedAt,
    })
  },
}
