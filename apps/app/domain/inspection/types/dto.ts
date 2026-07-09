// =============================================================================
// inspection 도메인 — 결과/DTO 타입
// =============================================================================
// 점검 흐름은 성공/실패를 예외가 아니라 판별 유니온(valid/reason, success/reason)으로
// 표현한다. QR 세션 상태(만료/완료/미존재)를 UI 가 구분해 안내해야 하기 때문이다.
// =============================================================================

import type { InspectionSession, ChecklistItem, Facility } from './entity'

export type InspectionPageData = {
  session: InspectionSession
  facility: Facility
  checklistItems: ChecklistItem[]
}

export type InspectionSessionResult =
  | { valid: true; data: InspectionPageData }
  | { valid: false; reason: 'expired' | 'completed' | 'not_found' }

export type VerifyResult =
  | { success: true; sessionId: string }
  | { success: false; reason: 'unauthorized' | 'no_checklist' | 'not_found' | 'session_error' }

export type InspectStatusData = {
  facility: Facility
  lastInspection: string | null
  dailyCount: number
  weeklyCount: number
  monthlyCount: number
  checklistItems: ChecklistItem[]
  hasChecklist: boolean
}

export type InspectionHistoryItem = {
  session_id: string
  submitted_at: string
  inspector_name: string | null
  inspector_phone: string | null
  pass_count: number
  fail_count: number
  total_count: number
}

export type InspectionHistoryDetail = {
  session_id: string
  submitted_at: string
  inspector_name: string | null
  inspector_phone: string | null
  items: {
    id: string
    item_name: string
    response_type: 'checklist' | 'photo'
    is_required: boolean
    sort_order: number
    result: boolean | string | null // checklist: boolean, photo: URL string, 미응답: null
  }[]
}

export type WorkspaceInspectionHistoryItem = InspectionHistoryItem & {
  facility_id: string
  facility_name: string
}

export type PhotoUploadResult =
  | { success: true; url: string }
  | { success: false; error: string }
