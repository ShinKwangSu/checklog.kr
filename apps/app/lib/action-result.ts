// =============================================================================
// checklog.kr App — ActionResult / runAction (변경 Server Action 공통 봉투)
// =============================================================================
// 변경 액션의 try/catch 봉투를 일원화한다.
//   - 성공: { success: true, data? }
//   - 검증/비즈니스 실패: DomainError 의 메시지를 그대로 노출
//   - 시스템 실패: 내부 예외 메시지를 숨기고 fallbackMessage 로 마스킹 + 서버 로깅
//   - redirect() 예외(NEXT_REDIRECT)는 반드시 재던져 리다이렉트를 보존한다.
//
// 검증 오류도 DomainError 로 throw 하면 사용자에게 메시지가 노출된다.
//
// 반환 타입은 판별 유니온(discriminated union)이라 컴포넌트에서 result.success 로
// 좁히면 data/error 접근이 타입 안전하다. (앱 전반 컴포넌트 계약과 일치)
// =============================================================================

import { isRedirectError } from './is-redirect-error'
import { DomainError } from './domain-error'

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

export async function runAction<T>(
  fn: () => Promise<T>,
  fallbackMessage: string
): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (e) {
    // redirect()/signIn() 의 NEXT_REDIRECT 예외는 삼키지 않고 재던진다.
    if (isRedirectError(e)) throw e
    // 비즈니스 예외만 메시지를 노출한다.
    if (e instanceof DomainError) {
      return { success: false, error: e.message }
    }
    // 시스템 예외: 내부 메시지(스키마/컬럼/드라이버 정보)를 숨기고 서버에만 로깅한다.
    console.error('[action]', fallbackMessage, e)
    return { success: false, error: fallbackMessage }
  }
}
