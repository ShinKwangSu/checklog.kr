// =============================================================================
// auth 도메인 — service (비즈니스 로직)
// =============================================================================
// 비밀번호 해싱(평문 저장 금지)과 계정 생성을 담당한다. 로그인/로그아웃은
// next-auth(signIn/signOut) 와 redirect 흐름에 강하게 결합되어 action 에 둔다.
// =============================================================================

import { randomBytes, createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { TypedSupabaseClient } from '@checklog/database'
import { sendPasswordResetEmail } from '@checklog/email'
import { DomainError } from '@/lib/domain-error'
import { authRepository } from '../repository/auth.repository'
import type { SignUpInput } from '../types'

type Db = TypedSupabaseClient

const SALT_ROUNDS = 10
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000 // 30분

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

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

  /**
   * 비밀번호 재설정 요청.
   * 계정 존재 여부와 무관하게 동일하게 반환한다(이메일 존재 열거 방지) —
   * 활성 계정이 있을 때만 실제로 토큰을 생성하고 메일을 보낸다.
   */
  async requestPasswordReset(supabase: Db, email: string): Promise<void> {
    const account = await authRepository.findActiveAccountByEmail(supabase, email)
    if (!account) return

    const token = randomBytes(32).toString('base64url')
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()

    await authRepository.createPasswordResetToken(supabase, {
      subjectId: account.id,
      tokenHash,
      expiresAt,
    })

    const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000'
    await sendPasswordResetEmail({
      to: account.email,
      from: process.env.EMAIL_FROM ?? 'checklog.kr <noreply@checklog.kr>',
      productName: 'checklog.kr',
      resetUrl: `${baseUrl}/reset-password?token=${token}`,
    })
  },

  /** 토큰을 검증하고 새 비밀번호로 갱신한 뒤 토큰을 소비 처리한다. */
  async resetPassword(
    supabase: Db,
    token: string,
    newPassword: string
  ): Promise<void> {
    const tokenHash = hashToken(token)
    const found = await authRepository.findValidResetToken(supabase, tokenHash)
    if (!found) {
      throw new DomainError('유효하지 않거나 만료된 링크입니다.')
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await authRepository.updatePassword(supabase, found.subjectId, passwordHash)
    await authRepository.consumeResetToken(supabase, found.id)
  },

  /** 로그인 상태에서 현재 비밀번호를 검증한 후 새 비밀번호로 변경한다. */
  async changePassword(
    supabase: Db,
    accountId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const account = await authRepository.findAccountSecretById(supabase, accountId)
    if (!account) throw new DomainError('계정을 찾을 수 없습니다.')

    const matched = await bcrypt.compare(currentPassword, account.password_hash)
    if (!matched) throw new DomainError('현재 비밀번호가 올바르지 않습니다.')

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await authRepository.updatePassword(supabase, accountId, newHash)
  },
}
