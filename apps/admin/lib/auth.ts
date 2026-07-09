// =============================================================================
// checklog.kr Admin — requireAdmin() 인증 헬퍼
// =============================================================================
//
// Server Action / 데이터 접근 레이어 진입부에서 슈퍼어드민 인증을 강제한다.
// 미인증 시 throw 하여 즉시 차단한다.
//
// 슈퍼어드민은 고객 격리 대상이 아니므로 account_id 필터를 적용하지 않는다.
// (전역 데이터 접근이 의도된 설계)
// =============================================================================

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * 슈퍼어드민 인증 강제. 미인증 시 /login 으로 리다이렉트.
 * 반환된 adminId 는 admins.id(UUID) 이다.
 *
 * JWT 존재만으로는 부족하다 — 삭제(soft delete)된 어드민의 세션 토큰은 만료 전까지
 * 유효하므로, 매 진입 시 admins 테이블에서 실재/활성 여부를 재검증한다(삭제 즉시 차단).
 */
export async function requireAdmin(): Promise<{ adminId: string }> {
  const session = await auth()
  if (!session?.user?.adminId) {
    redirect('/login')
  }
  const adminId = session.user.adminId

  const supabase = createClient()
  const { data, error } = await supabase
    .from('admins')
    .select('id')
    .eq('id', adminId)
    .is('deleted_at', null)
    .maybeSingle()

  // 삭제되었거나 존재하지 않는 어드민이면 접근을 차단한다.
  if (error || !data) {
    redirect('/login')
  }

  return { adminId }
}
