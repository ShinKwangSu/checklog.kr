import { z } from 'zod'

// Server Action(부분 수정)과 클라이언트 폼(전체 필드 필수) 이 공유하는 필드 정의.
const accountFields = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, '업체명을 입력해주세요.')
    .max(255, '업체명이 너무 깁니다.'),
  adminName: z
    .string()
    .trim()
    .min(1, '관리자명을 입력해주세요.')
    .max(100, '관리자명이 너무 깁니다.'),
  phone: z
    .string()
    .trim()
    .min(1, '전화번호를 입력해주세요.')
    .max(50, '전화번호가 너무 깁니다.'),
})

// 클라이언트 폼: 항상 전체 필드를 채워 제출한다.
export const accountFormSchema = accountFields

// Server Action: PATCH 형태의 부분 수정을 허용한다.
export const updateAccountSchema = accountFields.partial()
