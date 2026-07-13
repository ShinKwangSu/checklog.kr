// =============================================================================
// CheckLog 관리자 포털 — 비밀번호 재설정 페이지
// =============================================================================
// Server Component 셸 + Client 폼. 이메일 링크의 token 쿼리를 읽어 폼에 전달한다.
// =============================================================================

import Link from 'next/link'

import { ResetPasswordForm } from '@/components/reset-password-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@checklog/ui/components/card'

export default async function ResetPasswordPage({
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
              비밀번호 재설정 링크가 올바르지 않습니다. 다시 요청해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent />
          <CardFooter>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              비밀번호 찾기로 이동
            </Link>
          </CardFooter>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <ResetPasswordForm token={token} />
    </main>
  )
}
