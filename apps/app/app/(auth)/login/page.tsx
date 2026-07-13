"use client";

// =============================================================================
// checklog.kr MVP — 로그인 페이지
// =============================================================================
// loginAction(prevState, formData) 을 useActionState 로 연결한다.
// 성공 시 액션 내부에서 /dashboard/workspaces 로 redirect(NEXT_REDIRECT) 되므로
// 클라이언트에서 별도 라우팅 처리를 하지 않는다.
// =============================================================================

import Link from "next/link";
import { useActionState, useState } from "react";

import { loginAction, type AuthActionState } from "@/domain/auth";
import { Button } from "@checklog/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@checklog/ui/components/card";
import { Input } from "@checklog/ui/components/input";
import { Label } from "@checklog/ui/components/label";

const initialState: AuthActionState = { success: false };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );
  // Server Action 제출 후 React가 비제어 입력을 초기화하므로, 실패 시에도
  // 이메일이 남아있도록 제어 컴포넌트로 관리한다(비밀번호는 보안상 그대로 비운다).
  const [email, setEmail] = useState("");

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>
            checklog.kr 시설 관리 어드민에 로그인하세요.
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
                placeholder=""
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!state?.fieldErrors?.email}
              />
              {state?.fieldErrors?.email?.[0] && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.email[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">비밀번호</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder=""
                required
                aria-invalid={!!state?.fieldErrors?.password}
              />
              {state?.fieldErrors?.password?.[0] && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.password[0]}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "로그인 중..." : "로그인"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              계정이 없으신가요?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                회원가입
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
