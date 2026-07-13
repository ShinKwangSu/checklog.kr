'use client'

// =============================================================================
// auth 도메인 — Client Hooks
// =============================================================================

import { useMutation } from '@tanstack/react-query'
import {
  changePasswordAction,
  resendVerificationEmailAction,
  updateEmailAction,
} from '../actions/auth.actions'

/** 비밀번호 변경 (로그인 상태) */
export function useChangePassword() {
  return useMutation({
    mutationFn: (formData: FormData) => changePasswordAction(undefined, formData),
  })
}

/** 가입 인증 메일 재전송 */
export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: (formData: FormData) => resendVerificationEmailAction(formData),
  })
}

/** 가입 인증 대기 중 이메일 수정 */
export function useUpdateEmail() {
  return useMutation({
    mutationFn: (formData: FormData) => updateEmailAction(formData),
  })
}
