'use server'

// =============================================================================
// auth 도메인 — Server Actions (진입점)
// =============================================================================
//
// - 회원가입 = accounts 마스터 계정 1행 생성(= 멀티고객 격리 루트). 가입 성공 시
//   자동 로그인하여 세션 JWT 에 accountId 를 적재한다.
// - signIn/signOut 의 redirectTo 는 NEXT_REDIRECT 예외를 throw 하므로 반드시 재던진다.
// - 반환 타입은 AuthActionState(fieldErrors 포함)라 runAction 봉투를 쓰지 않는다.
// =============================================================================

import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import { createClient } from '@/lib/supabase/server'
import { signIn, signOut } from '@/auth'
import { isRedirectError } from '@/lib/is-redirect-error'
import { DomainError } from '@/lib/domain-error'
import { runAction, type ActionResult } from '@/lib/action-result'
import { requireAccountId } from '@/lib/auth'
import {
  signUpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validations/auth.validations'
import { authService } from '../service/auth.service'
import type { AuthActionState } from '../types'

// -----------------------------------------------------------------------------
// 회원가입
// -----------------------------------------------------------------------------

export async function signUpAction(
  _prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return {
      success: false,
      error: '입력값을 확인해주세요.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const { company_name, admin_name, phone, email, password } = parsed.data

  try {
    const supabase = createClient()
    await authService.registerAccount(supabase, {
      companyName: company_name,
      adminName: admin_name,
      phone,
      email,
      password,
    })
  } catch (e) {
    if (e instanceof DomainError) return { success: false, error: e.message }
    console.error('[signUpAction]', e)
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' }
  }

  // 가입 후 자동 로그인. 성공하면 redirectTo 로 이동(NEXT_REDIRECT throw).
  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard/workspaces' })
  } catch (err) {
    // signIn 의 redirect 예외는 상위로 다시 던져 실제 리다이렉트가 일어나게 한다.
    if (isRedirectError(err)) throw err
    return {
      success: false,
      error: '가입은 완료되었으나 자동 로그인에 실패했습니다. 로그인해주세요.',
    }
  }

  return { success: true }
}

// -----------------------------------------------------------------------------
// 로그인
// -----------------------------------------------------------------------------

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
      redirectTo: '/dashboard/workspaces',
    })
  } catch (err) {
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

// -----------------------------------------------------------------------------
// 비밀번호 변경 (로그인 상태)
// -----------------------------------------------------------------------------

export async function changePasswordAction(
  _prevState: ActionResult<void> | undefined,
  formData: FormData
): Promise<ActionResult<void>> {
  return runAction(async () => {
    const accountId = await requireAccountId()
    const parsed = changePasswordSchema.safeParse({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword'),
    })
    if (!parsed.success) {
      throw new DomainError(
        parsed.error.errors[0]?.message ?? '입력값을 확인해주세요.'
      )
    }

    const supabase = createClient()
    await authService.changePassword(
      supabase,
      accountId,
      parsed.data.currentPassword,
      parsed.data.newPassword
    )
  }, '비밀번호 변경 중 오류가 발생했습니다.')
}
