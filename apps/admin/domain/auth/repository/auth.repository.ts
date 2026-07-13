// =============================================================================
// admin auth 도메인 — repository (DB 접근)
// =============================================================================
// admins 테이블은 RLS 미적용 + anon/authenticated 권한 회수 상태이므로,
// 반드시 service_role 클라이언트(@/lib/supabase/server 의 createClient)로
// 조회해야 한다(anon 키로는 0행 반환).
// =============================================================================

import type { TypedSupabaseClient } from '@checklog/database'

type Db = TypedSupabaseClient

type ActiveAdmin = {
  id: string
  email: string
  password_hash: string
  name: string
}

export const authRepository = {
  /**
   * 활성(미삭제) 어드민을 이메일로 조회한다(로그인 검증 전용).
   * password_hash 는 서버에서만 SELECT — 호출부는 이를 절대 클라이언트로 반환하지 않는다.
   * admins.Row 타입이 AdminWithSecret(해시 포함)이므로 명시적 컬럼 지정으로
   * 의도치 않은 해시 노출을 한 번 더 차단한다.
   */
  async findActiveAdminByEmail(
    supabase: Db,
    email: string
  ): Promise<ActiveAdmin | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('id, email, password_hash, name')
      .eq('email', email)
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
      .from('admins')
      .update({ password_hash: passwordHash })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error
  },

  /** 비밀번호 재설정 토큰을 생성한다(subject_type: 'admin' 고정). */
  async createPasswordResetToken(
    supabase: Db,
    row: { subjectId: string; tokenHash: string; expiresAt: string }
  ): Promise<void> {
    const { error } = await supabase.from('password_reset_tokens').insert({
      subject_type: 'admin',
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
      .eq('subject_type', 'admin')
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
