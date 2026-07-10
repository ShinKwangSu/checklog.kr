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
