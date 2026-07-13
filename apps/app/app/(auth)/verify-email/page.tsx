// =============================================================================
// checklog.kr MVP — 이메일 인증 페이지
// =============================================================================
// Server Component 셸 + Client 폼. 이메일 링크의 token 쿼리를 읽어 폼에 전달한다.
// =============================================================================

import Link from 'next/link'

import { VerifyEmailForm } from '@/components/verify-email-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@checklog/ui/components/card'

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">유효하지 않은 링크</CardTitle>
            <CardDescription>
              이메일 인증 링크가 올바르지 않습니다. 가입하신 이메일함을 다시 확인해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent />
          <CardFooter>
            <Link
              href="/login"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              로그인으로 이동
            </Link>
          </CardFooter>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <VerifyEmailForm token={token} />
    </main>
  )
}
