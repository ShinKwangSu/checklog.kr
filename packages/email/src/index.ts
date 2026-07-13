import 'server-only'
import { resend } from './client'
import { buildPasswordResetEmail } from './templates/password-reset'
import { buildVerificationEmail } from './templates/email-verification'

/**
 * 비밀번호 재설정 링크 이메일 발송.
 * 발송 실패 시 예외를 던진다(호출부에서 DomainError 로 변환).
 */
export async function sendPasswordResetEmail({
  to,
  from,
  productName,
  resetUrl,
}: {
  to: string
  from: string
  productName: string
  resetUrl: string
}): Promise<void> {
  const { subject, html } = buildPasswordResetEmail({ productName, resetUrl })

  const { error } = await resend.emails.send({ from, to, subject, html })
  if (error) {
    throw new Error(`비밀번호 재설정 이메일 발송 실패: ${error.message}`)
  }
}

/**
 * 회원가입 이메일 인증 링크 이메일 발송.
 * 발송 실패 시 예외를 던진다(호출부에서 DomainError 로 변환).
 */
export async function sendVerificationEmail({
  to,
  from,
  productName,
  verifyUrl,
}: {
  to: string
  from: string
  productName: string
  verifyUrl: string
}): Promise<void> {
  const { subject, html } = buildVerificationEmail({ productName, verifyUrl })

  const { error } = await resend.emails.send({ from, to, subject, html })
  if (error) {
    throw new Error(`이메일 인증 메일 발송 실패: ${error.message}`)
  }
}
