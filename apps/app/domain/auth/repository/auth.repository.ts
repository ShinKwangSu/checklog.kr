// =============================================================================
// auth 도메인 — repository (DB 접근)
// =============================================================================
// accounts 테이블은 멀티고객 격리의 루트다(id = account_id). 이메일 UNIQUE 위반
// (23505)은 알려진 비즈니스 제약이므로 DomainError 로 번역한다.
// =============================================================================

import type { TypedSupabaseClient } from '@checklog/database'
import { DomainError } from '@/lib/domain-error'

type Db = TypedSupabaseClient

type TokenPurpose = 'password_reset' | 'email_verification'

type AccountWithSecret = {
  id: string
  email: string
  password_hash: string
  admin_name: string
  company_name: string
  status: 'pending' | 'active' | 'suspended'
}

export const authRepository = {
  /** 마스터 계정 생성 (이메일 중복 → DomainError). 항상 status='pending'으로 생성된다. */
  async createAccount(
    supabase: Db,
    row: {
      companyName: string
      adminName: string
      phone: string
      email: string
      passwordHash: string
    }
  ): Promise<{ id: string }> {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        company_name: row.companyName,
        admin_name: row.adminName,
        phone: row.phone,
        email: row.email,
        password_hash: row.passwordHash,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error || !data) {
      if (error?.code === '23505') throw new DomainError('이미 사용 중인 이메일입니다.')
      throw error ?? new Error('계정 생성에 실패했습니다.')
    }
    return data
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
      .select('id, email, password_hash, admin_name, company_name, status')
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
      .select('id, email, password_hash, admin_name, company_name, status')
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
      .select('id, email, password_hash, admin_name, company_name, status')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !data) return null
    return data
  },

  /** status='pending'인 계정을 이메일로 조회한다(가입 인증 재전송/이메일 수정 전용). */
  async findPendingAccountByEmail(
    supabase: Db,
    email: string
  ): Promise<{ id: string; email: string } | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, email')
      .eq('email', email)
      .eq('status', 'pending')
      .is('deleted_at', null)
      .single()

    if (error || !data) return null
    return data
  },

  /** id로 계정의 status만 조회한다(워크스페이스 생성 등 기능 가드 전용, 최소 컬럼). */
  async findAccountStatusById(
    supabase: Db,
    id: string
  ): Promise<{ status: string } | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('status')
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

  /** 계정의 이메일을 갱신한다(가입 인증 대기 중 이메일 수정 전용). 중복 시 DomainError. */
  async updateAccountEmail(supabase: Db, id: string, newEmail: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .update({ email: newEmail })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) {
      if (error.code === '23505') throw new DomainError('이미 사용 중인 이메일입니다.')
      throw error
    }
  },

  /** 계정을 활성화한다(이메일 인증 완료). */
  async activateAccount(supabase: Db, id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .update({ status: 'active' })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error
  },

  /** 토큰을 생성한다(subject_type: 'account' 고정, purpose로 용도 구분). */
  async createToken(
    supabase: Db,
    row: { subjectId: string; purpose: TokenPurpose; tokenHash: string; expiresAt: string }
  ): Promise<void> {
    const { error } = await supabase.from('password_reset_tokens').insert({
      subject_type: 'account',
      subject_id: row.subjectId,
      purpose: row.purpose,
      token_hash: row.tokenHash,
      expires_at: row.expiresAt,
    })

    if (error) throw error
  },

  /** 만료/소비되지 않은 유효 토큰을 해시+용도로 조회한다. */
  async findValidToken(
    supabase: Db,
    tokenHash: string,
    purpose: TokenPurpose
  ): Promise<{ id: string; subjectId: string } | null> {
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('id, subject_id, expires_at, consumed_at')
      .eq('subject_type', 'account')
      .eq('token_hash', tokenHash)
      .eq('purpose', purpose)
      .is('consumed_at', null)
      .single()

    if (error || !data) return null
    if (new Date(data.expires_at).getTime() < Date.now()) return null

    return { id: data.id, subjectId: data.subject_id }
  },

  /** 토큰을 1회성으로 소비 처리한다. */
  async consumeToken(supabase: Db, id: string): Promise<void> {
    const { error } = await supabase
      .from('password_reset_tokens')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },

  /** 특정 계정의 특정 용도 미사용 토큰을 전부 폐기한다(비밀번호 변경/이메일 수정 시). */
  async invalidateTokens(supabase: Db, subjectId: string, purpose: TokenPurpose): Promise<void> {
    const { error } = await supabase
      .from('password_reset_tokens')
      .update({ consumed_at: new Date().toISOString() })
      .eq('subject_type', 'account')
      .eq('subject_id', subjectId)
      .eq('purpose', purpose)
      .is('consumed_at', null)

    if (error) throw error
  },

  /** 최근 발급된 토큰들의 생성 시각을 최신순으로 조회한다(재전송 쿨다운/상한 판단용). */
  async listRecentTokenTimestamps(
    supabase: Db,
    subjectId: string,
    purpose: TokenPurpose,
    sinceISO: string
  ): Promise<string[]> {
    const { data, error } = await supabase
      .from('password_reset_tokens')
      .select('created_at')
      .eq('subject_type', 'account')
      .eq('subject_id', subjectId)
      .eq('purpose', purpose)
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data.map((row) => row.created_at)
  },
}
