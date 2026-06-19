'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { verifyAndCreateSession } from '@/app/actions/inspection'

export function InspectEntryButton({ facilityId }: { facilityId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  function handleClose() {
    setOpen(false)
    setPhone('')
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await verifyAndCreateSession(facilityId, phone)
      if (result.success) {
        router.push(`/inspect/${facilityId}/${result.sessionId}`)
      } else {
        setError('등록된 점검자 정보와 일치하지 않습니다.')
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
      >
        점검하기
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-end gap-3">
      <p className="text-sm text-muted-foreground">전화번호 뒤 4자리를 입력해주세요</p>
      <input
        type="text"
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        value={phone}
        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
        placeholder="0000"
        autoFocus
        className="w-24 rounded-md border bg-background px-3 py-2 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={phone.length !== 4 || isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50 transition-opacity"
        >
          {isPending ? '확인 중...' : '확인'}
        </button>
      </div>
    </form>
  )
}
