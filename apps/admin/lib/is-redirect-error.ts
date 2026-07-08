// =============================================================================
// Next.js redirect() 예외 판별 유틸
// =============================================================================
// redirect()/signIn() 의 redirectTo 는 NEXT_REDIRECT 라는 특수 예외를 던져 상위로
// 전파시키는 방식으로 동작한다. try/catch 로 비즈니스 에러를 잡는 Server Action에서
// 이 예외까지 삼켜버리면 리다이렉트가 동작하지 않으므로, 반드시 식별해 재던져야 한다.
// =============================================================================

export function isRedirectError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as { digest?: unknown }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}
