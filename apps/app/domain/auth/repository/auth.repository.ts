// =============================================================================
// auth 도메인 — repository (DB 접근)
// =============================================================================
// accounts 테이블은 멀티고객 격리의 루트다(id = account_id). 이메일 UNIQUE 위반
// (23505)은 알려진 비즈니스 제약이므로 DomainError 로 번역한다.
// =============================================================================

import type { TypedSupabaseClient } from '@checklog/database'
import { DomainError } from '@/lib/domain-error'

type Db = TypedSupabaseClient

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
}
