'use server'

// =============================================================================
// inspection 도메인 — Server Actions (진입점)
// =============================================================================
// 보안 모델:
//   - 대부분 비로그인(방문자) 경로. 세션 id(추측 불가 UUID)와 시설 존재로 무결성 확보.
//   - getWorkspaceInspectionHistory 만 고객 인증(account 격리).
//
// 조회 흐름은 실패 시 예외 대신 부정 결과(null/[]/reason)를 반환한다(서버 컴포넌트/
// 클라이언트가 상태를 구분해 안내). 그래서 인프라 예외도 try/catch 로 흡수한다.
// =============================================================================

import { createClient } from '@/lib/supabase/server'
import { getAccountId, requireAccountId } from '@/lib/auth'
import { runAction, type ActionResult } from '@/lib/action-result'
import { DomainError } from '@/lib/domain-error'
import { inspectionService } from '../service/inspection.service'
import type {
  InspectionSessionResult,
  VerifyResult,
  InspectStatusData,
  InspectionHistoryItem,
  InspectionHistoryDetail,
  WorkspaceInspectionHistoryItem,
  PhotoUploadResult,
} from '../types'

// -----------------------------------------------------------------------------
// 세션 조회 / 제출 / 생성 (비로그인)
// -----------------------------------------------------------------------------

export async function getInspectionSession(
  facilityId: string,
  sessionId: string
): Promise<InspectionSessionResult> {
  try {
    const supabase = createClient()
    return await inspectionService.getSession(supabase, facilityId, sessionId)
  } catch {
    return { valid: false, reason: 'not_found' }
  }
}

export async function submitInspection(
  sessionId: string,
  facilityId: string,
  itemResults: Record<string, boolean | string>
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = createClient()
    await inspectionService.submit(supabase, sessionId, facilityId, itemResults)
    return undefined
  }, '점검 제출 중 오류가 발생했습니다.')
}

export async function verifyAndCreateSession(
  facilityId: string,
  phoneLast4: string
): Promise<VerifyResult> {
  try {
    const supabase = createClient()
    return await inspectionService.verifyAndCreateSession(supabase, facilityId, phoneLast4)
  } catch {
    return { success: false, reason: 'session_error' }
  }
}

// -----------------------------------------------------------------------------
// 공개 현황 / 이력 조회
// -----------------------------------------------------------------------------

export async function getInspectStatus(
  facilityId: string
): Promise<InspectStatusData | null> {
  try {
    const supabase = createClient()
    return await inspectionService.getStatus(supabase, facilityId)
  } catch {
    return null
  }
}

export async function getInspectionHistory(
  facilityId: string
): Promise<InspectionHistoryItem[]> {
  try {
    const supabase = createClient()
    return await inspectionService.getHistory(supabase, facilityId)
  } catch {
    return []
  }
}

export async function getInspectionDetail(
  sessionId: string,
  facilityId: string
): Promise<InspectionHistoryDetail | null> {
  try {
    const supabase = createClient()
    return await inspectionService.getDetail(supabase, sessionId, facilityId)
  } catch {
    return null
  }
}

export async function getWorkspaceInspectionHistory(
  workspaceId: string
): Promise<WorkspaceInspectionHistoryItem[]> {
  try {
    const accountId = await getAccountId()
    if (!accountId) return []
    const supabase = createClient()
    return await inspectionService.getWorkspaceHistory(supabase, accountId, workspaceId)
  } catch {
    return []
  }
}

// -----------------------------------------------------------------------------
// 사진 업로드 (비로그인)
// -----------------------------------------------------------------------------

export async function uploadInspectionPhoto(
  sessionId: string,
  facilityId: string,
  itemId: string,
  formData: FormData
): Promise<PhotoUploadResult> {
  const file = formData.get('file') as File | null
  try {
    const supabase = createClient()
    const url = await inspectionService.uploadPhoto(supabase, {
      sessionId,
      facilityId,
      itemId,
      file,
    })
    return { success: true, url }
  } catch (e) {
    if (e instanceof DomainError) return { success: false, error: e.message }
    const message = e instanceof Error ? e.message : '알 수 없는 오류'
    console.error('[uploadInspectionPhoto]', e)
    return { success: false, error: `사진 업로드 실패: ${message}` }
  }
}
