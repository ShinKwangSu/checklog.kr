'use server'

// =============================================================================
// checklog.kr MVP — 인증 Server Action (회원가입 / 로그인 / 로그아웃)
// =============================================================================
//
// - 비밀번호는 bcryptjs 로 해싱하여 저장한다(평문 저장 금지).
// - 회원가입 = accounts 테이블에 마스터 계정 1행 생성(= 멀티고객 격리 루트).
//   account_id 는 곧 이 행의 id 이므로 별도 컬럼이 없다.
// - 가입 성공 시 자동 로그인하여 세션 JWT 에 accountId 를 적재한다.
// =============================================================================

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { createClient } from '@/lib/supabase/server'
import { signIn, signOut } from '@/auth'

const SALT_ROUNDS = 10

export type AuthActionState = {
  success: boolean
  error?: string
  // 필드별 검증 오류(폼 인라인 표시용)
  fieldErrors?: Record<string, string[]>
}

// -----------------------------------------------------------------------------
// 회원가입
// -----------------------------------------------------------------------------

const signUpSchema = z.object({
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

/**
 * 회원가입 Server Action.
 * useActionState(signUpAction, initialState) 또는 form action 으로 사용한다.
 *
 * 성공 시 자동 로그인 후 /dashboard/workspaces 로 redirect 된다
 * (redirect 는 내부적으로 예외를 throw 하므로 정상 흐름이며 그대로 통과시킨다).
 */
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
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

  const supabase = createClient()
  const { error } = await supabase.from('accounts').insert({
    company_name,
    admin_name,
    phone,
    email,
    password_hash,
  })

  if (error) {
    // 23505 = unique_violation (이메일 중복)
    if (error.code === '23505') {
      return { success: false, error: '이미 사용 중인 이메일입니다.' }
    }
    return { success: false, error: '회원가입 중 오류가 발생했습니다.' }
  }

  // 가입 후 자동 로그인. 성공하면 redirectTo 로 이동(NEXT_REDIRECT throw).
  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard/workspaces',
    })
  } catch (err) {
    // signIn 의 redirect 예외는 상위로 다시 던져 실제 리다이렉트가 일어나게 한다.
    if (isRedirectError(err)) throw err
    // 자격 검증 실패 등(가입 직후라 사실상 발생하지 않음)
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

const loginSchema = z.object({
  email: z.string().trim().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

/**
 * 로그인 Server Action.
 * 성공 시 /dashboard/workspaces 로 redirect 된다.
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
// 내부 유틸
// -----------------------------------------------------------------------------

/**
 * Next.js redirect()/signIn redirect 는 NEXT_REDIRECT 라는 특수 예외를 던진다.
 * 이를 일반 에러로 잡아버리면 리다이렉트가 동작하지 않으므로 식별해 재던진다.
 */
function isRedirectError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as { digest?: unknown }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}
