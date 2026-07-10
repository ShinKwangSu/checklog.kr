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
}
