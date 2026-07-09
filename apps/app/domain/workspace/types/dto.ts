// =============================================================================
// workspace 도메인 — 입력 DTO
// =============================================================================
// minFloorInput 은 UI 계약상 "지하 깊이 양수"(예: 지하 2층 → 2, 0 = 지하 없음)로
// 들어온다. 음수 변환(저장 값)은 service 에서 수행한다.
// =============================================================================

export type WorkspaceWriteInput = {
  workspaceName: string
  maxFloor: number
  /** 지하 깊이(양수, 0=지하 없음). service 가 음수로 변환해 저장한다. */
  minFloorInput: number
  address: string | null
  addressDetail: string | null
  memo: string | null
}
