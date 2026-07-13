import { z } from 'zod'

export const signUpSchema = z.object({
  company_name: z.string().trim().min(1, '업체명을 입력해주세요.'),
  admin_name: z.string().trim().min(1, '관리자 이름을 입력해주세요.'),
  phone: z
    .string()
    .trim()
    .min(1, '전화번호를 입력해주세요.')
    .max(11, '전화번호는 11자리 이하여야 합니다.')
    .regex(/^\d+$/, '전화번호는 숫자만 입력 가능합니다.'),
  email: z.string().trim().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
})

export const loginSchema = z.object({
  email: z.string().trim().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('올바른 이메일 형식이 아닙니다.'),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, '유효하지 않은 링크입니다.'),
    // bcrypt 72바이트 상한과 과대입력 방어를 위해 상한을 둔다.
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

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
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

export const resendVerificationSchema = z.object({
  email: z.string().trim().email('올바른 이메일 형식이 아닙니다.'),
})

export const updateEmailSchema = z.object({
  currentEmail: z.string().trim().email('올바른 이메일 형식이 아닙니다.'),
  newEmail: z.string().trim().email('올바른 이메일 형식이 아닙니다.'),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1, '유효하지 않은 링크입니다.'),
})
