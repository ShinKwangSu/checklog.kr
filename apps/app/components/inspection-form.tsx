'use client'

// =============================================================================
// spotcare.kr MVP — 점검표 입력 폼 (클라이언트 컴포넌트)
// =============================================================================

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { submitInspection } from '@/app/actions/inspection'
import type { ChecklistItem } from '@/types/database'
import { Button } from '@spotcare/ui/components/button'

type Props = {
  sessionId: string
  facilityId: string
  checklistItems: ChecklistItem[]
}

export function InspectionForm({ sessionId, facilityId, checklistItems }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(checklistItems.map((item) => [item.id, false]))
  )
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const requiredIds = checklistItems
    .filter((item) => item.is_required)
    .map((item) => item.id)
  const allRequiredChecked = requiredIds.every((id) => checked[id])

  function toggleItem(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleSubmit() {
    if (!allRequiredChecked) {
      toast.error('필수 항목을 모두 체크해주세요.')
      return
    }
    startTransition(async () => {
      const result = await submitInspection(sessionId, facilityId, checked)
      if (result.success) {
        router.push(`/inspect/${facilityId}/${sessionId}/success`)
      } else {
        toast.error(result.error)
      }
    })
  }

  if (checklistItems.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        등록된 점검 항목이 없습니다.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {checklistItems.map((item) => (
          <label
            key={item.id}
            className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <input
              type="checkbox"
              checked={checked[item.id] ?? false}
              onChange={() => toggleItem(item.id)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
            />
            <span className="text-sm leading-relaxed">
              {item.item_name}
              {item.is_required && (
                <span className="ml-1 text-destructive font-medium">*</span>
              )}
            </span>
          </label>
        ))}
      </div>

      {requiredIds.length > 0 && (
        <p className="text-xs text-muted-foreground">* 표시된 항목은 필수입니다.</p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending || !allRequiredChecked}
        className="w-full"
        size="lg"
      >
        {isPending ? '제출 중...' : '점검 완료'}
      </Button>
    </div>
  )
}
