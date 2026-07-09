// =============================================================================
// checklog.kr Admin — DomainError
// =============================================================================
// 사용자에게 그대로 노출해도 되는 "비즈니스(도메인) 예외"를 표현한다.
// service 레이어의 비즈니스 규칙 위반(중복 이메일, 미존재, 권한 등)은 DomainError 로
// throw 하고, 그 외(Supabase/Postgres 인프라 예외 등 시스템 예외)는 일반 Error 로
// 전파되어 runAction 에서 일반 메시지로 마스킹된다(내부 스키마 정보 누출 방지).
// =============================================================================

export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}
