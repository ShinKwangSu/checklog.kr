// =============================================================================
// inspection 도메인 — service (비즈니스 로직)
// =============================================================================
// 점검 세션 검증, 점검 제출, 통계/이력 집계를 담당한다. 세션 흐름 결과는 예외가
// 아니라 판별 유니온으로 반환한다(UI 가 만료/완료/미존재를 구분해 안내).
// pass/fail 집계는 목록·워크스페이스 이력에서 공통이므로 summarizeSession 으로 통합.
// =============================================================================

import type { TypedSupabaseClient } from '@checklog/database'
import { DomainError } from '@/lib/domain-error'
import { inspectionRepository, type ItemResults } from '../repository/inspection.repository'
import type {
  InspectionSessionResult,
  VerifyResult,
  InspectStatusData,
  InspectionHistoryItem,
  InspectionHistoryDetail,
  WorkspaceInspectionHistoryItem,
} from '../types'

type Db = TypedSupabaseClient

type SessionLike = { id: string; completed_at: string | null }
type ResultLike = { submitted_at: string; item_results: ItemResults } | undefined
type InspectorLike = { name: string | null; phone: string | null } | null | undefined

/** 세션+결과+점검자를 이력 항목(pass/fail 집계 포함)으로 요약한다. */
function summarizeSession(
  session: SessionLike,
  result: ResultLike,
  inspector: InspectorLike
): InspectionHistoryItem {
  const values = Object.values(result?.item_results ?? {}) as (boolean | string)[]
  const passCount = values.filter(
    (v) => v === true || (typeof v === 'string' && v.length > 0)
  ).length
  const failCount = values.filter((v) => v === false).length

  return {
    session_id: session.id,
    submitted_at: result?.submitted_at ?? session.completed_at ?? '',
    inspector_name: inspector?.name ?? null,
    inspector_phone: inspector?.phone ?? null,
    pass_count: passCount,
    fail_count: failCount,
    total_count: values.length,
  }
}

export const inspectionService = {
  /** QR 세션 + 점검 데이터 조회 (만료/완료/미존재 구분) */
  async getSession(
    supabase: Db,
    facilityId: string,
    sessionId: string
  ): Promise<InspectionSessionResult> {
    const session = await inspectionRepository.findActiveSession(supabase, {
      sessionId,
      facilityId,
    })

    if (!session) {
      const raw = await inspectionRepository.findSessionStatus(supabase, { sessionId, facilityId })
      if (!raw) return { valid: false, reason: 'not_found' }
      return { valid: false, reason: raw.status === 'completed' ? 'completed' : 'expired' }
    }

    const facility = await inspectionRepository.findFacility(supabase, facilityId)
    if (!facility) return { valid: false, reason: 'not_found' }

    const checklistId = await inspectionRepository.findFacilityChecklistId(supabase, facilityId)
    if (!checklistId) return { valid: false, reason: 'not_found' }

    const checklistItems = await inspectionRepository.findChecklistItems(supabase, {
      checklistId,
    })

    return { valid: true, data: { session, facility, checklistItems } }
  },

  /** 점검 제출 (세션 유효 검증 → 결과 저장 → 세션 완료) */
  async submit(
    supabase: Db,
    sessionId: string,
    facilityId: string,
    itemResults: ItemResults
  ): Promise<void> {
    const session = await inspectionRepository.findActiveSessionId(supabase, {
      sessionId,
      facilityId,
    })
    if (!session) {
      throw new DomainError('세션이 만료됐습니다. QR을 다시 찍어주세요.')
    }

    await inspectionRepository.insertResult(supabase, { sessionId, facilityId, itemResults })
    await inspectionRepository.completeSession(supabase, sessionId)
  },

  /** 전화번호 뒤 4자리 인증 후 세션 생성 */
  async verifyAndCreateSession(
    supabase: Db,
    facilityId: string,
    phoneLast4: string
  ): Promise<VerifyResult> {
    if (!/^\d{4}$/.test(phoneLast4)) {
      return { success: false, reason: 'unauthorized' }
    }

    const facility = await inspectionRepository.findFacilityForVerify(supabase, facilityId)
    if (!facility) return { success: false, reason: 'not_found' }

    const checklistId = await inspectionRepository.findFacilityChecklistId(supabase, facilityId)
    if (!checklistId) return { success: false, reason: 'no_checklist' }

    const inspector = await inspectionRepository.findInspectorByPhoneLast4(supabase, {
      workspaceId: facility.workspace_id,
      phoneLast4,
    })
    if (!inspector) return { success: false, reason: 'unauthorized' }

    const session = await inspectionRepository.createSession(supabase, {
      facilityId,
      inspectorId: inspector.id,
    })
    if (!session) return { success: false, reason: 'session_error' }

    return { success: true, sessionId: session.id }
  },

  /** 공개 현황 데이터 (KST 기준 오늘/이번주/이번달 집계) */
  async getStatus(supabase: Db, facilityId: string): Promise<InspectStatusData | null> {
    // 날짜 경계는 KST(UTC+9) 기준으로 계산한다(서버가 UTC여도 한국 기준 집계가 맞도록).
    const KST_OFFSET_MS = 9 * 60 * 60 * 1000
    const nowKST = new Date(Date.now() + KST_OFFSET_MS)
    const todayStart = new Date(
      Date.UTC(nowKST.getUTCFullYear(), nowKST.getUTCMonth(), nowKST.getUTCDate()) - KST_OFFSET_MS
    ).toISOString()
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = new Date(
      Date.UTC(nowKST.getUTCFullYear(), nowKST.getUTCMonth(), 1) - KST_OFFSET_MS
    ).toISOString()

    const [facility, lastInspection, dailyCount, weeklyCount, monthlyCount, checklistId] =
      await Promise.all([
        inspectionRepository.findFacility(supabase, facilityId),
        inspectionRepository.findLastInspectionAt(supabase, facilityId),
        inspectionRepository.countResultsSince(supabase, { facilityId, since: todayStart }),
        inspectionRepository.countResultsSince(supabase, { facilityId, since: weekAgo }),
        inspectionRepository.countResultsSince(supabase, { facilityId, since: monthStart }),
        inspectionRepository.findFacilityChecklistId(supabase, facilityId),
      ])

    if (!facility) return null

    const checklistItems = checklistId
      ? await inspectionRepository.findChecklistItems(supabase, { checklistId })
      : []

    return {
      facility,
      lastInspection,
      dailyCount,
      weeklyCount,
      monthlyCount,
      checklistItems,
      hasChecklist: !!checklistId,
    }
  },

  /** 시설 점검 이력 목록 */
  async getHistory(supabase: Db, facilityId: string): Promise<InspectionHistoryItem[]> {
    const sessions = await inspectionRepository.findCompletedSessions(supabase, {
      facilityId,
      limit: 100,
    })
    if (sessions.length === 0) return []

    const inspectorIds = [
      ...new Set(sessions.map((s) => s.inspector_id).filter(Boolean) as string[]),
    ]
    const [results, inspectors] = await Promise.all([
      inspectionRepository.findResultsBySessionIds(supabase, sessions.map((s) => s.id)),
      inspectionRepository.findInspectorsByIds(supabase, inspectorIds),
    ])

    const resultMap = new Map(results.map((r) => [r.session_id, r]))
    const inspectorMap = new Map(inspectors.map((i) => [i.id, i]))

    return sessions.map((s) =>
      summarizeSession(s, resultMap.get(s.id), s.inspector_id ? inspectorMap.get(s.inspector_id) : null)
    )
  },

  /** 점검 이력 상세 (삭제된 항목도 포함해 표시) */
  async getDetail(
    supabase: Db,
    sessionId: string,
    facilityId: string
  ): Promise<InspectionHistoryDetail | null> {
    const session = await inspectionRepository.findCompletedSession(supabase, {
      sessionId,
      facilityId,
    })
    if (!session) return null

    const checklistId = await inspectionRepository.findFacilityChecklistId(supabase, facilityId)
    const [result, inspector] = await Promise.all([
      inspectionRepository.findResultBySession(supabase, sessionId),
      session.inspector_id
        ? inspectionRepository.findInspectorById(supabase, session.inspector_id)
        : Promise.resolve(null),
    ])

    const allItems = checklistId
      ? await inspectionRepository.findChecklistItems(supabase, {
          checklistId,
          includeDeleted: true,
        })
      : []

    const itemResults = result?.item_results ?? {}

    return {
      session_id: session.id,
      submitted_at: result?.submitted_at ?? session.completed_at ?? '',
      inspector_name: inspector?.name ?? null,
      inspector_phone: inspector?.phone ?? null,
      items: allItems
        .filter((item) => item.id in itemResults)
        .map((item) => ({
          id: item.id,
          item_name: item.item_name,
          response_type: item.response_type,
          is_required: item.is_required,
          sort_order: item.sort_order,
          result: item.id in itemResults ? itemResults[item.id] : null,
        })),
    }
  },

  /** 워크스페이스 전체 점검 이력 (account 격리) */
  async getWorkspaceHistory(
    supabase: Db,
    accountId: string,
    workspaceId: string
  ): Promise<WorkspaceInspectionHistoryItem[]> {
    const facilities = await inspectionRepository.findWorkspaceFacilities(supabase, {
      workspaceId,
      accountId,
    })
    if (facilities.length === 0) return []

    const facilityMap = new Map(facilities.map((f) => [f.id, f.facility_name]))
    const sessions = await inspectionRepository.findCompletedSessionsByFacilities(supabase, {
      facilityIds: facilities.map((f) => f.id),
      limit: 200,
    })
    if (sessions.length === 0) return []

    const inspectorIds = [
      ...new Set(sessions.map((s) => s.inspector_id).filter(Boolean) as string[]),
    ]
    const [results, inspectors] = await Promise.all([
      inspectionRepository.findResultsBySessionIds(supabase, sessions.map((s) => s.id)),
      inspectionRepository.findInspectorsByIds(supabase, inspectorIds),
    ])

    const resultMap = new Map(results.map((r) => [r.session_id, r]))
    const inspectorMap = new Map(inspectors.map((i) => [i.id, i]))

    return sessions.map((s) => ({
      ...summarizeSession(
        s,
        resultMap.get(s.id),
        s.inspector_id ? inspectorMap.get(s.inspector_id) : null
      ),
      facility_id: s.facility_id,
      facility_name: facilityMap.get(s.facility_id) ?? '알 수 없음',
    }))
  },

  /** 점검 사진 업로드 (세션 유효 검증 → 저장 → 공개 URL) */
  async uploadPhoto(
    supabase: Db,
    params: { sessionId: string; facilityId: string; itemId: string; file: File | null }
  ): Promise<string> {
    const session = await inspectionRepository.findActiveSessionId(supabase, {
      sessionId: params.sessionId,
      facilityId: params.facilityId,
    })
    if (!session) {
      throw new DomainError('세션이 만료됐습니다. QR을 다시 찍어주세요.')
    }

    const file = params.file
    if (!file || file.size === 0) throw new DomainError('파일이 없습니다.')
    if (file.size > 10 * 1024 * 1024) {
      throw new DomainError('파일 크기는 10MB 이하여야 합니다.')
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${params.facilityId}/${params.sessionId}/${params.itemId}.${ext}`
    return inspectionRepository.uploadPhoto(supabase, { path, file })
  },
}
