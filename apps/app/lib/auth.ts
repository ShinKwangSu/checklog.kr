// =============================================================================
// checklog.kr App — 인증 헬퍼 (고객 계정 격리)
// =============================================================================
// 고객 어드민은 자신의 account_id 로 스코프된 데이터에만 접근한다. Server Action /
// 데이터 접근 레이어 진입부에서 로그인 세션의 accountId 를 확보한다.
//   - getAccountId(): 조회 액션용. 미인증이면 null (호출부가 빈 결과로 처리).
//   - requireAccountId(): 변경 액션용. 미인증이면 DomainError 로 throw →
//     runAction 이 '로그인이 필요합니다.' 메시지로 변환한다.
//
// account_id 필터는 멀티고객 격리의 실질 방어선이다(service_role 키가 RLS 를
// 우회하므로 코드 레벨 필터가 격리를 보장한다).
// =============================================================================

import { auth } from '@/auth'
import { DomainError } from './domain-error'

export async function getAccountId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.accountId ?? null
}

export async function requireAccountId(): Promise<string> {
  const accountId = await getAccountId()
  if (!accountId) throw new DomainError('로그인이 필요합니다.')
  return accountId
}
