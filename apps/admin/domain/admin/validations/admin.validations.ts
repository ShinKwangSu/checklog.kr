import { z } from 'zod'

// Server Action(생성/부분 수정)과 클라이언트 폼(전체 필드 필수) 이 공유하는 필드 정의.
const adminFields = z.object({
  email: z.string().trim().email('올바른 이메일 형식이 아닙니다.'),
  name: z.string().trim().min(1, '이름을 입력해주세요.').max(100, '이름이 너무 깁니다.'),
})

// 클라이언트 폼(생성/수정 다이얼로그): 항상 전체 필드를 채워 제출한다.
export const adminFormSchema = adminFields

export const createAdminSchema = adminFields

// Server Action: PATCH 형태의 부분 수정을 허용한다.
export const updateAdminSchema = adminFields.partial()

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
    // bcrypt 는 72바이트 초과분을 조용히 절단하므로 상한을 명시해 예측 불가 동작을 막는다.
    newPassword: z
      .string()
      .min(8, '새 비밀번호는 8자 이상이어야 합니다.')
      .max(72, '새 비밀번호는 72자 이하여야 합니다.'),
    confirmPassword: z.string().min(1, '새 비밀번호 확인을 입력해주세요.'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: '새 비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  })
