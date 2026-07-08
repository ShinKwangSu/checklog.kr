// =============================================================================
// account 도메인 — Query Keys
// =============================================================================
// 인라인 query key 금지. 모든 키는 이 팩토리를 통해 생성한다.
// query param(page, search)은 query key 와 1:1 대응한다.
// =============================================================================

export const accountQueryKeys = {
  all: ['accounts'] as const,
  list: (page: number, search?: string) =>
    [...accountQueryKeys.all, 'list', { page, search: search ?? '' }] as const,
  detail: (accountId: string) =>
    [...accountQueryKeys.all, 'detail', accountId] as const,
}
