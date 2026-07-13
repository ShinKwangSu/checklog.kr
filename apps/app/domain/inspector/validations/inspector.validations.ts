import { z } from 'zod'

export const inspectorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '이름을 입력해주세요.')
    .max(100, '이름은 100자 이내로 입력해주세요.'),
  phone: z
    .string()
    .trim()
    // 하이픈 제거 후 검사 — 폼에서 formatPhone 포맷으로 입력되더라도 통과
    .transform((v) => v.replace(/-/g, ''))
    .pipe(
      z
        .string()
        .min(1, '전화번호를 입력해주세요.')
        .regex(/^010\d{7,8}$/, '010으로 시작하는 휴대폰 번호를 입력해주세요.')
    ),
  email: z
    .string()
    .trim()
    .email('올바른 이메일 형식이 아닙니다.')
    .optional()
    .or(z.literal('')),
})

export type InspectorInput = z.infer<typeof inspectorSchema>
