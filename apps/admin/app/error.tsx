'use client'

// =============================================================================
// 앱 전역 에러 바운더리 (dashboard 외 세그먼트 — 로그인 페이지 등)
// =============================================================================
// dashboard 하위는 app/dashboard/error.tsx가 더 구체적으로 처리한다.
// =============================================================================

import { useEffect } from 'react'
import { Button } from '@checklog/ui/components/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm text-muted-foreground">
        페이지를 표시하는 중 오류가 발생했습니다.
      </p>
      <Button onClick={() => reset()}>다시 시도</Button>
    </div>
  )
}
