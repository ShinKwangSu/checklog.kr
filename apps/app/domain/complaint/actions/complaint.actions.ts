'use server'

// =============================================================================
// complaint 도메인 — Server Actions (진입점)
// =============================================================================
// 보안 경계:
//   - submitComplaint / uploadComplaintPhoto: 비로그인(방문자). 인증을 요구하지 않고
//     service 가 facilityId 존재 검증으로 무결성을 확보한다.
//   - getWorkspaceComplaints / getComplaints / updateComplaintStatus: 고객 인증 필수.
// =============================================================================

import { createClient } from '@/lib/supabase/server'
import { getAccountId, requireAccountId } from '@/lib/auth'
import { runAction, type ActionResult } from '@/lib/action-result'
import { DomainError } from '@/lib/domain-error'
import { complaintService } from '../service/complaint.service'
import type {
  Complaint,
  ComplaintStatus,
  ComplaintWithFacility,
  PhotoUploadResult,
  SubmitComplaintInput,
} from '../types'

// -----------------------------------------------------------------------------
// 비로그인 경로 (방문자)
// -----------------------------------------------------------------------------

export async function submitComplaint(
  facilityId: string,
  input: SubmitComplaintInput
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = createClient()
    await complaintService.submit(supabase, facilityId, input)
    return undefined
  }, '민원 접수 중 오류가 발생했습니다.')
}

export async function uploadComplaintPhoto(
  facilityId: string,
  formData: FormData
): Promise<PhotoUploadResult> {
  const file = formData.get('file') as File | null
  const key = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  try {
    const supabase = createClient()
    const url = await complaintService.uploadPhoto(supabase, facilityId, file, key)
    return { success: true, url }
  } catch (e) {
    if (e instanceof DomainError) return { success: false, error: e.message }
    const message = e instanceof Error ? e.message : '알 수 없는 오류'
    console.error('[uploadComplaintPhoto]', e)
    return { success: false, error: `사진 업로드 실패: ${message}` }
  }
}

// -----------------------------------------------------------------------------
// 인증 경로 (고객)
// -----------------------------------------------------------------------------

export async function getWorkspaceComplaints(
  workspaceId: string
): Promise<ComplaintWithFacility[]> {
  try {
    const accountId = await getAccountId()
    if (!accountId) return []
    const supabase = createClient()
    return await complaintService.listWorkspaceComplaints(supabase, accountId, workspaceId)
  } catch {
    return []
  }
}

export async function getComplaints(facilityId: string): Promise<Complaint[]> {
  try {
    const accountId = await getAccountId()
    if (!accountId) return []
    const supabase = createClient()
    return await complaintService.listByFacility(supabase, accountId, facilityId)
  } catch {
    return []
  }
}

export async function updateComplaintStatus(
  complaintId: string,
  status: ComplaintStatus
): Promise<ActionResult> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const supabase = createClient()
    await complaintService.changeStatus(supabase, accountId, complaintId, status)
    return undefined
  }, '상태 변경 중 오류가 발생했습니다.')
}
