'use client'

// =============================================================================
// ForgotPasswordForm — 비밀번호 찾기(재설정 메일 발송) 요청 폼
// =============================================================================
// requestPasswordResetAction 을 useActionState 로 연결한다. 계정 존재 여부와
// 무관하게 항상 동일한 성공 메시지를 보여준다(이메일 존재 열거 방지).
// =============================================================================

import { useActionState } from 'react'
import Link from 'next/link'

import { requestPasswordResetAction, type AuthActionState } from '@/domain/auth'
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

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    initialState
  )

  if (state.success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">이메일을 확인해주세요</CardTitle>
          <CardDescription>
            입력하신 이메일로 비밀번호 재설정 링크를 보내드렸습니다. 메일이 보이지
            않으면 스팸함도 확인해주세요.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link
            href="/login"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
        <CardDescription>
          가입하신 이메일을 입력하시면 재설정 링크를 보내드립니다.
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              required
              aria-invalid={!!state?.fieldErrors?.email}
            />
            {state?.fieldErrors?.email?.[0] && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.email[0]}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? '전송 중...' : '재설정 링크 보내기'}
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
