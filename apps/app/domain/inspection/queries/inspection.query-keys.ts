// =============================================================================
// inspection 도메인 — Query Keys
// =============================================================================
// 인라인 query key 금지. 모든 키는 이 팩토리를 통해 생성한다.
// =============================================================================

export const inspectionQueryKeys = {
  all: ['inspections'] as const,
  histories: () => [...inspectionQueryKeys.all, 'history'] as const,
  history: (facilityId: string) =>
    [...inspectionQueryKeys.histories(), facilityId] as const,
  details: () => [...inspectionQueryKeys.all, 'detail'] as const,
  detail: (sessionId: string, facilityId: string) =>
    [...inspectionQueryKeys.details(), sessionId, facilityId] as const,
}
