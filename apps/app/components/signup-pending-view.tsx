'use client'

// =============================================================================
// SignupPendingView — 회원가입 직후 이메일 인증 대기 화면
// =============================================================================
// "인증 메일 재전송" / "이메일 수정"을 제공한다. 재전송·이메일수정 저장은 서버에서
// 쿨다운/상한을 검사하므로 실패 시 그 메시지를 그대로 toast로 보여준다.
// =============================================================================

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

import { useResendVerificationEmail, useUpdateEmail } from '@/domain/auth'
import { Button } from '@checklog/ui/components/button'
import { Input } from '@checklog/ui/components/input'
import { Label } from '@checklog/ui/components/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@checklog/ui/components/card'

export function SignupPendingView({
  email,
  onEmailChange,
}: {
  email: string
  onEmailChange: (newEmail: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [newEmail, setNewEmail] = useState(email)

  const { mutate: resend, isPending: isResending } = useResendVerificationEmail()
  const { mutate: updateEmail, isPending: isUpdating } = useUpdateEmail()

  function handleResend() {
    const formData = new FormData()
    formData.set('email', email)
    resend(formData, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('인증 메일을 다시 보냈습니다.')
        } else {
          toast.error(result.error ?? '인증 메일 재전송에 실패했습니다.')
        }
      },
      onError: () => toast.error('인증 메일 재전송 중 오류가 발생했습니다.'),
    })
  }

  function handleSaveEmail() {
    const formData = new FormData()
    formData.set('currentEmail', email)
    formData.set('newEmail', newEmail)
    updateEmail(formData, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('이메일을 수정하고 인증 메일을 다시 보냈습니다.')
          onEmailChange(result.data?.email ?? newEmail)
          setIsEditing(false)
        } else {
          toast.error(result.error ?? '이메일 수정에 실패했습니다.')
        }
      },
      onError: () => toast.error('이메일 수정 중 오류가 발생했습니다.'),
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">이메일을 확인해주세요</CardTitle>
        {!isEditing && (
          <CardDescription>
            <span className="font-medium text-foreground">{email}</span> 으로 인증
            메일을 보냈습니다. 메일이 보이지 않으면 스팸함도 확인해주세요.
          </CardDescription>
        )}
      </CardHeader>

      {isEditing && (
        <CardContent className="space-y-2">
          <Label htmlFor="newEmail">새 이메일</Label>
          <Input
            id="newEmail"
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
        </CardContent>
      )}

      <CardFooter>
        {isEditing ? (
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={isUpdating}
              onClick={() => {
                setNewEmail(email)
                setIsEditing(false)
              }}
            >
              취소
            </Button>
            <Button className="flex-1" disabled={isUpdating} onClick={handleSaveEmail}>
              {isUpdating ? '저장 중...' : '저장'}
            </Button>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={isResending}
                onClick={handleResend}
              >
                {isResending ? '전송 중...' : '인증 메일 재전송'}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>
                이메일 수정
              </Button>
            </div>
            <Link
              href="/login"
              className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              로그인으로 돌아가기
            </Link>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
