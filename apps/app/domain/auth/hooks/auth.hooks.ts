'use client'

// =============================================================================
// auth 도메인 — Client Hooks
// =============================================================================

import { useMutation } from '@tanstack/react-query'
import { changePasswordAction } from '../actions/auth.actions'

/** 비밀번호 변경 (로그인 상태) */
export function useChangePassword() {
  return useMutation({
    mutationFn: (formData: FormData) => changePasswordAction(undefined, formData),
  })
}
