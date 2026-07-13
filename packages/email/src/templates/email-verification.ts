// =============================================================================
// 이메일 인증(회원가입) 메일 템플릿
// =============================================================================

export function buildVerificationEmail({
  productName,
  verifyUrl,
}: {
  productName: string
  verifyUrl: string
}): { subject: string; html: string } {
  return {
    subject: `[${productName}] 이메일 인증 안내`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 18px; margin-bottom: 16px;">이메일 인증</h2>
        <p style="font-size: 14px; color: #333; line-height: 1.6;">
          ${productName} 회원가입을 완료하려면 이메일 인증이 필요합니다.<br />
          아래 버튼을 눌러 인증 페이지로 이동해주세요. 페이지에서 버튼을 한 번 더 누르면
          인증이 완료됩니다. 이 링크는 24시간 동안 유효합니다.
        </p>
        <p style="margin: 24px 0;">
          <a
            href="${verifyUrl}"
            style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px;"
          >
            인증 페이지로 이동
          </a>
        </p>
        <p style="font-size: 12px; color: #888; line-height: 1.6;">
          본인이 요청하지 않았다면 이 이메일을 무시하셔도 됩니다.<br />
          버튼이 동작하지 않으면 아래 링크를 복사해 브라우저에 붙여넣어주세요.<br />
          ${verifyUrl}
        </p>
      </div>
    `,
  }
}
