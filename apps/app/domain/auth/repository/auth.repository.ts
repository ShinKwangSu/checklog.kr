// =============================================================================
// auth 도메인 — repository (DB 접근)
// =============================================================================
// accounts 테이블은 멀티고객 격리의 루트다(id = account_id). 이메일 UNIQUE 위반
// (23505)은 알려진 비즈니스 제약이므로 DomainError 로 번역한다.
// =============================================================================

import type { TypedSupabaseClient } from '@checklog/database'
import { DomainError } from '@/lib/domain-error'

type Db = TypedSupabaseClient

type AccountWithSecret = {
  id: string
  email: string
  password_hash: string
  admin_name: string
  company_name: string
}

export const authRepository = {
  /** 마스터 계정 생성 (이메일 중복 → DomainError) */
  async createAccount(
    supabase: Db,
    row: {
      companyName: string
      adminName: string
      phone: string
      email: string
      passwordHash: string
    }
  ): Promise<void> {
    const { error } = await supabase.from('accounts').insert({
      company_name: row.companyName,
      admin_name: row.adminName,
      phone: row.phone,
      email: row.email,
      password_hash: row.passwordHash,
    })

    if (error) {
      if (error.code === '23505') throw new DomainError('이미 사용 중인 이메일입니다.')
      throw error
    }
  },

  /**
   * 이메일로 계정을 조회한다(로그인 검증 전용).
   * password_hash 는 서버에서만 SELECT — 호출부는 이를 절대 클라이언트로 반환하지 않는다.
   */
  async findAccountByEmail(
    supabase: Db,
    email: string
  ): Promise<AccountWithSecret | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, email, password_hash, admin_name, company_name')
      .eq('email', email)
      .single()

    if (error || !data) return null
    return data
  },

  /**
   * 활성(미삭제) 계정을 이메일로 조회한다(비밀번호 찾기 전용).
   * 삭제된 계정은 재설정 대상에서 제외한다.
   */
  async findActiveAccountByEmail(
    supabase: Db,
    email: string
  ): Promise<AccountWithSecret | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, email, password_hash, admin_name, company_name')
      .eq('email', email)
      .is('deleted_at', null)
      .single()

    if (error || !data) return null
    return data
  },

  /** id로 계정을 조회한다(비밀번호 변경 시 현재 비밀번호 검증용). */
  async findAccountSecretById(
    supabase: Db,
    id: string
  ): Promise<AccountWithSecret | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, email, password_hash, admin_name, company_name')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !data) return null
    return data
  },

  /** 비밀번호 해시를 갱신한다. */
  async updatePassword(
    supabase: Db,
    id: string,
    passwordHash: string
  ): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .update({ password_hash: passwordHash })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error
  },

  /** 비밀번호 재설정 토큰을 생성한다(subject_type: 'account' 고정). */
  async createPasswordResetToken(
    supabase: Db,
    row: { subjectId: string; tokenHash: string; expiresAt: string }
  ): Promise<void> {
    const { error } = await supabase.from('password_reset_tokens').insert({
      subject_type: 'account',
      subject_id: row.subjectId,
      token_hash: row.tokenHash,
      expires_at: row.expiresAt,
    })

    if (error) throw error
  },

  /** 만료/소비되지 않은 유효 토큰을 해시로 조회한다. */
  async findValidResetToken(
    supabase: Db,
    tokenHash: string
  ): Promise<{ id: string; subjectId: string } | null> {
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('id, subject_id, expires_at, consumed_at')
      .eq('subject_type', 'account')
      .eq('token_hash', tokenHash)
      .is('consumed_at', null)
      .single()

    if (error || !data) return null
    if (new Date(data.expires_at).getTime() < Date.now()) return null

    return { id: data.id, subjectId: data.subject_id }
  },

  /** 토큰을 1회성으로 소비 처리한다. */
  async consumeResetToken(supabase: Db, id: string): Promise<void> {
    const { error } = await supabase
      .from('password_reset_tokens')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },
}
