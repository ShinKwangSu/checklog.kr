// =============================================================================
// complaint 도메인 — Query Keys
// =============================================================================
// 인라인 query key 금지. 모든 키는 이 팩토리를 통해 생성한다.
// =============================================================================

export const complaintQueryKeys = {
  all: ['complaints'] as const,
  lists: () => [...complaintQueryKeys.all, 'list'] as const,
  list: (facilityId: string) =>
    [...complaintQueryKeys.lists(), facilityId] as const,
}
