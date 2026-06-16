// =============================================================================
// spotcare.kr MVP — 시설 타입 Zod 검증 스키마
// =============================================================================
//
// Server Action 과 UI Form 이 공유한다.
// 워크스페이스 내 type_name 은 DB 에서 UNIQUE(workspace_id, type_name) 로
// 중복이 차단된다(Server Action 에서 23505 처리).
// =============================================================================

import { z } from 'zod'

/**
 * 시설 타입 생성/수정 입력 스키마.
 * workspace_id 는 액션 인자로 별도 전달되며, 여기서는 type_name 만 검증한다.
 */
export const facilityTypeSchema = z.object({
  type_name: z
    .string()
    .trim()
    .min(1, '타입 이름을 입력해주세요.')
    .max(100, '타입 이름은 100자 이내로 입력해주세요.'),
})

export type FacilityTypeInput = z.infer<typeof facilityTypeSchema>
