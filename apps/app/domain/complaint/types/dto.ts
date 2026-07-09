// =============================================================================
// complaint 도메인 — 입력/결과 DTO
// =============================================================================

/** 방문자 민원 접수 입력(비로그인) */
export type SubmitComplaintInput = {
  complaint_type: string
  content: string
  photo_urls?: string[]
}

/** 사진 업로드 결과(성공 시 공개 URL 반환) */
export type PhotoUploadResult =
  | { success: true; url: string }
  | { success: false; error: string }
