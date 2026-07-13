// =============================================================================
// 비밀번호 재설정 이메일 템플릿
// =============================================================================
// React Email 등 별도 템플릿 엔진 없이 순수 HTML 문자열로 구성한다(의존성 최소화).
// =============================================================================

export function buildPasswordResetEmail({
  productName,
  resetUrl,
}: {
  productName: string
  resetUrl: string
}): { subject: string; html: string } {
  return {
    subject: `[${productName}] 비밀번호 재설정 안내`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 18px; margin-bottom: 16px;">비밀번호 재설정</h2>
        <p style="font-size: 14px; color: #333; line-height: 1.6;">
          ${productName} 계정의 비밀번호 재설정을 요청하셨습니다.<br />
          아래 버튼을 눌러 새 비밀번호를 설정해주세요. 이 링크는 30분간 유효합니다.
        </p>
        <p style="margin: 24px 0;">
          <a
            href="${resetUrl}"
            style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px;"
          >
            비밀번호 재설정하기
          </a>
        </p>
        <p style="font-size: 12px; color: #888; line-height: 1.6;">
          본인이 요청하지 않았다면 이 이메일을 무시하셔도 됩니다.<br />
          버튼이 동작하지 않으면 아래 링크를 복사해 브라우저에 붙여넣어주세요.<br />
          ${resetUrl}
        </p>
      </div>
    `,
  }
}
