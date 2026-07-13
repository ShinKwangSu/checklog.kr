'use server'

// =============================================================================
// admin auth 도메인 — Server Actions (진입점)
// =============================================================================
//
// 슈퍼어드민은 회원가입 플로우가 없다. 계정은 시딩/수동 발급으로만 생성된다.
// 따라서 이 도메인은 로그인/로그아웃만 제공한다.
//
// - 비밀번호 검증/해싱은 auth.ts 의 Credentials authorize() 에서 수행한다
//   (bcrypt.compare). 이 액션은 signIn/signOut 트리거만 담당한다.
// - 로그인 성공 시 /dashboard 로 redirect 한다.
// =============================================================================

import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import { signIn, signOut } from '@/auth'
import { isRedirectError } from '@/lib/is-redirect-error'
import { DomainError } from '@/lib/domain-error'
import { createClient } from '@/lib/supabase/server'
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/auth.validations'
import { authService } from '../service/auth.service'
import type { AuthActionState } from '../types'

// -----------------------------------------------------------------------------
// 로그인
// -----------------------------------------------------------------------------

/**
 * 로그인 Server Action.
 * useActionState(loginAction, initialState) 또는 form action 으로 사용한다.
 * 성공 시 /dashboard 로 redirect 된다.
 */
export async function loginAction(
  _prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: '입력값을 확인해주세요.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/dashboard',
    })
  } catch (err) {
    // signIn 의 redirect 예외는 상위로 다시 던져 실제 리다이렉트가 일어나게 한다.
    if (isRedirectError(err)) throw err
    if (err instanceof AuthError) {
      // CredentialsSignin = 이메일/비밀번호 불일치
      return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
    }
    return { success: false, error: '로그인 중 오류가 발생했습니다.' }
  }

  return { success: true }
}

// -----------------------------------------------------------------------------
// 로그아웃
// -----------------------------------------------------------------------------

/**
 * 로그아웃 Server Action. 세션 종료 후 /login 으로 redirect 한다.
 */
export async function logoutAction() {
  await signOut({ redirectTo: '/login' })
}

// -----------------------------------------------------------------------------
// 비밀번호 찾기 (재설정 메일 발송)
// -----------------------------------------------------------------------------

/**
 * 비밀번호 재설정 메일 발송 요청.
 * 이메일 존재 여부와 무관하게 항상 동일한 성공 메시지를 반환한다(계정 열거 방지).
 */
export async function requestPasswordResetAction(
  _prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: '입력값을 확인해주세요.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = createClient()
    await authService.requestPasswordReset(supabase, parsed.data.email)
  } catch (e) {
    console.error('[requestPasswordResetAction]', e)
    // 발송 실패도 사용자에게는 동일한 안내를 보여준다(내부 오류 노출 방지).
  }

  return { success: true }
}

// -----------------------------------------------------------------------------
// 비밀번호 재설정 (토큰 검증 후 새 비밀번호 저장)
// -----------------------------------------------------------------------------

export async function resetPasswordAction(
  _prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: '입력값을 확인해주세요.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = createClient()
    await authService.resetPassword(
      supabase,
      parsed.data.token,
      parsed.data.newPassword
    )
  } catch (e) {
    if (e instanceof DomainError) return { success: false, error: e.message }
    console.error('[resetPasswordAction]', e)
    return { success: false, error: '비밀번호 재설정 중 오류가 발생했습니다.' }
  }

  redirect('/login')
}
