// =============================================================================
// facility 도메인 — 입력 DTO
// =============================================================================
// Server Action 이 FormData/Zod 파싱 결과를 도메인 입력(camelCase)으로 정규화해
// service 로 전달한다. service 이하 레이어는 FormData 를 알지 못한다.
// =============================================================================

/** 시설 생성/수정 공통 입력 */
export type FacilityWriteInput = {
  facilityName: string
  floor: number
  facilityTypeId: string
  memo: string | null
  /** 연결할 점검표 id. 없으면 null(점검표 미연결). */
  checklistId: string | null
}
