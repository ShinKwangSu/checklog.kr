// =============================================================================
// admin 도메인 — 엔티티 타입
// =============================================================================
//
// DB Row(AdminWithSecret, password_hash 포함)와 구분되는 도메인 엔티티.
// 클라이언트로 내려보내는 형태에는 password_hash 가 절대 포함되지 않는다.
// =============================================================================

/** 어드민 단건 DTO (password_hash 제외) */
export type AdminDto = {
  id: string
  email: string
  name: string
  createdAt: string
}

/** 어드민 목록 DTO (페이지네이션 메타 포함) */
export type AdminListDto = {
  admins: AdminDto[]
  total: number
  page: number
  pageSize: number
}

/**
 * 어드민 생성 결과 DTO.
 * 랜덤 발급된 1회용 임시 비밀번호(tempPassword)를 포함한다 — 생성 직후에만 반환되며
 * 저장·재조회되지 않는다(관리자가 신규 어드민에게 전달, 최초 로그인 후 변경).
 */
export type CreatedAdminDto = {
  admin: AdminDto
  tempPassword: string
}
