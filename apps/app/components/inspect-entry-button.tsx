'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { verifyAndCreateSession } from '@/app/actions/inspection'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@spotcare/ui/components/dialog'
import { Button } from '@spotcare/ui/components/button'


export function InspectEntryButton({ facilityId }: { facilityId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  function handleOpen() {
    setDigits(['', '', '', ''])
    setError('')
    setOpen(true)
    setTimeout(() => inputRefs[0].current?.focus(), 50)
  }

  function handleClose() {
    setOpen(false)
    setDigits(['', '', '', ''])
    setError('')
  }

  function handleDigitChange(idx: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = digit
    setDigits(next)
    setError('')
    if (digit && idx < 3) {
      inputRefs[idx + 1].current?.focus()
    } else if (digit && idx === 3) {
      const phone = [...next].join('')
      if (phone.length === 4) submitPhone(phone)
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs[idx - 1].current?.focus()
    }
  }

  function submitPhone(phone: string) {
    setError('')
    startTransition(async () => {
      const result = await verifyAndCreateSession(facilityId, phone)
      if (result.success) {
        router.push(`/inspect/${facilityId}/${result.sessionId}`)
      } else {
        setError('등록된 점검자 정보와 일치하지 않습니다.')
        setDigits(['', '', '', ''])
        setTimeout(() => inputRefs[0].current?.focus(), 50)
      }
    })
  }

  return (
    <>
      <Button size="sm" className="shrink-0" onClick={handleOpen}>
        점검하기
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>점검자 확인</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <p className="text-sm text-muted-foreground text-center">
              전화번호 뒤 4자리를 입력해주세요
            </p>

            <div className="flex justify-center gap-3">
              {digits.map((d, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={isPending}
                  className="h-14 w-12 rounded-lg border-2 bg-background text-center text-2xl font-mono focus:border-primary focus:outline-none disabled:opacity-40"
                />
              ))}
            </div>

            {isPending && (
              <p className="text-center text-sm text-muted-foreground">확인 중...</p>
            )}
            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
