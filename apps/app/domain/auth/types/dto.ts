// =============================================================================
// auth 도메인 — 입력/상태 DTO
// =============================================================================

/** 회원가입/로그인 Server Action 의 폼 상태(useActionState 용) */
export type AuthActionState = {
  success: boolean
  error?: string
  /** 필드별 검증 오류(폼 인라인 표시용) */
  fieldErrors?: Record<string, string[]>
}

/** 계정 등록 입력 */
export type SignUpInput = {
  companyName: string
  adminName: string
  phone: string
  email: string
  password: string
}
