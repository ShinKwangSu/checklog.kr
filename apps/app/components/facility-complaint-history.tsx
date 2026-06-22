'use client'

// =============================================================================
// spotcare.kr MVP — 시설별 민원이력 Sheet
// =============================================================================
// facility-inspection-history.tsx 패턴과 동일한 구조:
//   Sheet 트리거 버튼 → 목록 뷰 → 상세 뷰 (뒤로가기)
// 상세에서 상태 변경(접수 → 처리중 → 완료) 가능.
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { MessageSquareText, ArrowLeft, ImageIcon } from 'lucide-react'
import { Dialog, DialogContent } from '@spotcare/ui/components/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@spotcare/ui/components/sheet'
import { Button } from '@spotcare/ui/components/button'
import { Badge } from '@spotcare/ui/components/badge'
import { Skeleton } from '@spotcare/ui/components/skeleton'
import { Separator } from '@spotcare/ui/components/separator'
import { toast } from 'sonner'
import {
  getComplaints,
  updateComplaintStatus,
} from '@/app/actions/complaint'
import type { Complaint, FacilityWithChecklists } from '@/types/database'

// -----------------------------------------------------------------------------
// 유틸
// -----------------------------------------------------------------------------

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const STATUS_LABEL: Record<Complaint['status'], string> = {
  received: '접수',
  in_progress: '처리중',
  resolved: '완료',
}

const STATUS_VARIANT: Record<
  Complaint['status'],
  'secondary' | 'default' | 'outline'
> = {
  received: 'secondary',
  in_progress: 'default',
  resolved: 'outline',
}

const NEXT_STATUS: Partial<Record<Complaint['status'], Complaint['status']>> = {
  received: 'in_progress',
  in_progress: 'resolved',
}

// -----------------------------------------------------------------------------
// 목록 뷰
// -----------------------------------------------------------------------------

function ComplaintList({
  facilityId,
  facilityName,
  onSelect,
}: {
  facilityId: string
  facilityName: string
  onSelect: (item: Complaint) => void
}) {
  const [items, setItems] = useState<Complaint[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getComplaints(facilityId).then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [facilityId])

  if (loading) {
    return (
      <div className="space-y-3 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (!items?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <MessageSquareText className="mb-3 h-10 w-10 opacity-30" />
        <p className="text-sm">아직 접수된 민원이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 pt-4">
      <p className="text-xs text-muted-foreground">총 {items.length}건</p>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(item.created_at)}
                </p>
                <p className="text-sm font-medium truncate">
                  {item.complaint_type}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.content}
                </p>
              </div>
              <Badge
                variant={STATUS_VARIANT[item.status]}
                className="shrink-0 text-xs"
              >
                {STATUS_LABEL[item.status]}
              </Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// 상세 뷰
// -----------------------------------------------------------------------------

function ComplaintDetail({
  complaint: initial,
  onBack,
}: {
  complaint: Complaint
  onBack: () => void
}) {
  const [complaint, setComplaint] = useState(initial)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const nextStatus = NEXT_STATUS[complaint.status]

  async function handleStatusChange() {
    if (!nextStatus || isPending) return
    setIsPending(true)
    const result = await updateComplaintStatus(complaint.id, nextStatus)
    setIsPending(false)

    if (result.success) {
      setComplaint((prev) => ({
        ...prev,
        status: nextStatus,
        resolved_at:
          nextStatus === 'resolved' ? new Date().toISOString() : null,
      }))
      toast.success(`상태가 "${STATUS_LABEL[nextStatus]}"으로 변경되었습니다.`)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <Dialog
        open={!!lightbox}
        onOpenChange={(open) => { if (!open) setLightbox(null) }}
      >
        <DialogContent className="max-w-screen-md p-0 overflow-hidden bg-black border-0">
          {lightbox && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lightbox} alt="확대 보기" className="w-full h-auto" />
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-4 pt-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          목록으로
        </Button>

        {/* 메타 정보 */}
        <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              민원 정보
            </p>
            <Badge variant={STATUS_VARIANT[complaint.status]} className="text-xs">
              {STATUS_LABEL[complaint.status]}
            </Badge>
          </div>
          <p className="text-sm font-medium">{complaint.complaint_type}</p>
          <p className="text-xs text-muted-foreground">
            접수: {formatDateTime(complaint.created_at)}
          </p>
          {complaint.resolved_at && (
            <p className="text-xs text-muted-foreground">
              완료: {formatDateTime(complaint.resolved_at)}
            </p>
          )}
        </div>

        <Separator />

        {/* 내용 */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            내용
          </p>
          <p className="text-sm whitespace-pre-wrap">{complaint.content}</p>
        </div>

        {/* 첨부 사진 */}
        {complaint.photo_urls.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                첨부 사진 ({complaint.photo_urls.length}장)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {complaint.photo_urls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`민원 사진 ${i + 1}`}
                    className="w-full h-auto rounded-md cursor-pointer border"
                    onClick={() => setLightbox(url)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* 상태 변경 버튼 */}
        {nextStatus && (
          <>
            <Separator />
            <Button
              className="w-full"
              disabled={isPending}
              onClick={handleStatusChange}
            >
              {isPending
                ? '처리 중...'
                : `"${STATUS_LABEL[nextStatus]}"으로 변경`}
            </Button>
          </>
        )}
      </div>
    </>
  )
}

// -----------------------------------------------------------------------------
// 메인 컴포넌트 — Sheet 트리거 + 목록/상세 전환
// -----------------------------------------------------------------------------

export function FacilityComplaintHistory({
  facility,
}: {
  facility: FacilityWithChecklists
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Complaint | null>(null)

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) setSelected(null)
  }, [])

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <MessageSquareText className="h-4 w-4" />
          민원이력
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">
            {selected
              ? '민원 상세'
              : `민원이력 — ${facility.facility_name}`}
          </SheetTitle>
        </SheetHeader>

        {selected ? (
          <ComplaintDetail
            complaint={selected}
            onBack={() => setSelected(null)}
          />
        ) : (
          <ComplaintList
            facilityId={facility.id}
            facilityName={facility.facility_name}
            onSelect={setSelected}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
