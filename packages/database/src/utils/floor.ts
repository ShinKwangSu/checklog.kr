// =============================================================================
// checklog.kr MVP — 층수(floor) 변환 유틸리티
// =============================================================================
//
// 층수는 DB 에 정수로 저장한다(지상=양수, 지하=음수, 층 없음=0).
// 표시 문자열 변환과 드롭다운 옵션 생성은 앱 레이어(이 파일)의 책임이다.
// 백엔드 Server Action 과 UI 컴포넌트가 이 유틸리티를 공유한다.
//
// 변환 규칙 (01_db_schema.md / facility-backend 스킬 기준):
//   양수 n  → `${n}F`     예) 3  → "3F"
//   음수 n  → `B${|n|}`    예) -1 → "B1"
//   0       → "지상"        (층 구분이 없는 경우의 표시. UI 정책)
// =============================================================================

export type FloorOption = {
  value: number
  label: string
}

/**
 * 정수 층수를 표시 문자열로 변환한다.
 *
 * @example
 * floorToDisplay(3)   // "3F"
 * floorToDisplay(-1)  // "B1"
 * floorToDisplay(0)   // "지상"
 */
export function floorToDisplay(floor: number): string {
  if (floor > 0) return `${floor}F`
  if (floor < 0) return `B${Math.abs(floor)}`
  return '지상' // 0층: 층 구분 없음. 필요 시 UI 정책에 맞게 조정.
}

/**
 * 워크스페이스의 층수 범위로 Select 드롭다운 옵션을 내림차순 생성한다.
 * 0층(지상/지하 경계)은 옵션에서 제외한다.
 *
 * @param max - 지상 최고 층(양수, 워크스페이스 max_floor)
 * @param min - 지하 최저 층(음수, 워크스페이스 min_floor)
 * @returns max 에서 min 까지 내림차순. 0 제외.
 *
 * @example
 * generateFloorOptions(3, -1)
 * // [
 * //   { value: 3,  label: "3F" },
 * //   { value: 2,  label: "2F" },
 * //   { value: 1,  label: "1F" },
 * //   { value: -1, label: "B1" },
 * // ]
 */
export function generateFloorOptions(max: number, min: number): FloorOption[] {
  const options: FloorOption[] = []

  // 입력이 뒤집혀 들어와도 안전하게 동작하도록 상/하한을 정규화한다.
  const hi = Math.max(max, min)
  const lo = Math.min(max, min)

  for (let floor = hi; floor >= lo; floor--) {
    if (floor === 0) continue // 0층(경계)은 건너뜀
    options.push({ value: floor, label: floorToDisplay(floor) })
  }

  return options
}
