'use client'

// =============================================================================
// VerifyEmailForm — 이메일 인증 확인 버튼
// =============================================================================
// 링크 접속 즉시 자동 인증하지 않고, 버튼을 눌러야 인증된다(메일 클라이언트의
// 링크 프리페치로 토큰이 사용자가 누르기 전에 소모되는 것을 방지).
// =============================================================================

import { useActionState } from 'react'
import Link from 'next/link'

import { verifyEmailAction, type AuthActionState } from '@/domain/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@checklog/ui/components/card'
import { Button } from '@checklog/ui/components/button'

const initialState: AuthActionState = { success: false }

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(verifyEmailAction, initialState)

  if (state.success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">인증이 완료되었습니다</CardTitle>
          <CardDescription>이제 로그인해서 이용하실 수 있습니다.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
            href="/login"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            로그인하기
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">이메일 인증</CardTitle>
        <CardDescription>아래 버튼을 누르면 인증이 완료됩니다.</CardDescription>
      </CardHeader>

      <form action={formAction}>
        <input type="hidden" name="token" value={token} />
        <CardContent className="space-y-4">
          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '인증 중...' : '이메일 인증하기'}
          </Button>
          <Link
            href="/login"
            className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            지금 로그인하고 나중에 인증하기
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
