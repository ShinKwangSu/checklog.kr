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

import { AuthError } from 'next-auth'
import { createClient } from '@/lib/supabase/server'
import { signIn, signOut } from '@/auth'
import { isRedirectError } from '@/lib/is-redirect-error'
import { DomainError } from '@/lib/domain-error'
import { signUpSchema, loginSchema } from '../validations/auth.validations'
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
