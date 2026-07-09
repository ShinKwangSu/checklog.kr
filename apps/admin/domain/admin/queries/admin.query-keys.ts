// =============================================================================
// admin 도메인 — Query Keys
// =============================================================================
// 인라인 query key 금지. 모든 키는 이 팩토리를 통해 생성한다.
// =============================================================================

export const adminQueryKeys = {
  all: ['admins'] as const,
  // 모든 목록 쿼리(페이지 무관)를 한 번에 무효화하기 위한 부분 키.
  lists: () => [...adminQueryKeys.all, 'list'] as const,
  list: (page: number) => [...adminQueryKeys.lists(), { page }] as const,
  detail: (adminId: string) =>
    [...adminQueryKeys.all, 'detail', adminId] as const,
}
