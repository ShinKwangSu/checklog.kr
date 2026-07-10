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

import { AuthError } from 'next-auth'
import { signIn, signOut } from '@/auth'
import { isRedirectError } from '@/lib/is-redirect-error'
import { loginSchema } from '../validations/auth.validations'
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
