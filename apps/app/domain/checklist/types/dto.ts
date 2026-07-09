// =============================================================================
// checklist 도메인 — 입력 DTO
// =============================================================================
// 점검표는 항목(items)을 함께 저장하는 복합 애그리거트다. 항목에 id 가 있으면 기존
// 항목(수정), 없으면 신규 항목(삽입)으로 취급한다.
// =============================================================================

export type ChecklistItemWriteInput = {
  /** 있으면 기존 항목(수정 대상), 없으면 신규 항목(삽입) */
  id?: string
  itemName: string
  responseType: 'checklist' | 'photo'
  isRequired: boolean
}

export type ChecklistWriteInput = {
  checklistName: string
  description: string | null
  repeatCycle: 'daily' | 'weekly' | 'monthly'
  count: number
  /** 요일(0~6). weekly 가 아니면 service 에서 null 로 정규화한다. */
  days: number[] | null
  items: ChecklistItemWriteInput[]
}
