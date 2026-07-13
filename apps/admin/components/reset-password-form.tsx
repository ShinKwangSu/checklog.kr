'use client'

// =============================================================================
// ResetPasswordForm — 토큰 기반 새 비밀번호 설정 폼
// =============================================================================
// resetPasswordAction 을 useActionState 로 연결한다. 성공 시 액션 내부에서
// /login 으로 redirect(NEXT_REDIRECT) 되므로 클라이언트에서 별도 처리하지 않는다.
// =============================================================================

import { useActionState } from 'react'
import Link from 'next/link'

import { resetPasswordAction, type AuthActionState } from '@/domain/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@checklog/ui/components/card'
import { Button } from '@checklog/ui/components/button'
import { Input } from '@checklog/ui/components/input'
import { Label } from '@checklog/ui/components/label'

const initialState: AuthActionState = { success: false }

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialState
  )

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">새 비밀번호 설정</CardTitle>
        <CardDescription>새로 사용할 비밀번호를 입력해주세요.</CardDescription>
      </CardHeader>

      <form action={formAction}>
        <input type="hidden" name="token" value={token} />
        <CardContent className="space-y-4">
          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">새 비밀번호</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={!!state?.fieldErrors?.newPassword}
            />
            {state?.fieldErrors?.newPassword?.[0] && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.newPassword[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={!!state?.fieldErrors?.confirmPassword}
            />
            {state?.fieldErrors?.confirmPassword?.[0] && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '변경 중...' : '비밀번호 변경'}
          </Button>
          <Link
            href="/login"
            className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
