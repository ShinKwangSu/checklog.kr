'use client'

// =============================================================================
// 대시보드 에러 바운더리
// =============================================================================
// 렌더링 중 발생한 예외를 이 세그먼트 단위로 격리한다.
// 사이드바 등 상위 레이아웃은 그대로 유지되고, 콘텐츠 영역만 대체된다.
// =============================================================================

import { useEffect } from 'react'
import { Button } from '@checklog/ui/components/button'

export default function DashboardError({
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
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-sm text-muted-foreground">
        페이지를 표시하는 중 오류가 발생했습니다.
      </p>
      <Button onClick={() => reset()}>다시 시도</Button>
    </div>
  )
}
