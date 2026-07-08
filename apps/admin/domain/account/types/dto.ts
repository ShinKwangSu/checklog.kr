// =============================================================================
// account 도메인 — 요청 DTO / ActionResult
// =============================================================================

/** 고객 수정 입력 (업체명/관리자명/전화번호) */
export type UpdateAccountInput = {
  companyName?: string
  adminName?: string
  phone?: string
}

/** 고객 목록 조회 파라미터 */
export type AccountListParams = {
  page: number
  pageSize: number
  search?: string
}

/**
 * 변경 Server Action 의 표준 반환 형태.
 * 조회 Action 은 throw 로 처리하고 이 타입을 사용하지 않는다.
 */
export type AccountActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}
