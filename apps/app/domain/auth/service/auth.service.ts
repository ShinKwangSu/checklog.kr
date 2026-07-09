// =============================================================================
// auth 도메인 — service (비즈니스 로직)
// =============================================================================
// 비밀번호 해싱(평문 저장 금지)과 계정 생성을 담당한다. 로그인/로그아웃은
// next-auth(signIn/signOut) 와 redirect 흐름에 강하게 결합되어 action 에 둔다.
// =============================================================================

import bcrypt from 'bcryptjs'
import type { TypedSupabaseClient } from '@checklog/database'
import { authRepository } from '../repository/auth.repository'
import type { SignUpInput } from '../types'

type Db = TypedSupabaseClient

const SALT_ROUNDS = 10

export const authService = {
  /** 마스터 계정 등록 (비밀번호 해싱 후 저장) */
  async registerAccount(supabase: Db, input: SignUpInput): Promise<void> {
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)
    await authRepository.createAccount(supabase, {
      companyName: input.companyName,
      adminName: input.adminName,
      phone: input.phone,
      email: input.email,
      passwordHash,
    })
  },
}
