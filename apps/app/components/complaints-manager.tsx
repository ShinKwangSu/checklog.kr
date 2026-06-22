'use client'

// =============================================================================
// spotcare.kr MVP — 민원 관리 클라이언트 컴포넌트
// =============================================================================

import { useState, useCallback } from 'react'
import { MessageSquareText, ArrowLeft, ImageIcon } from 'lucide-react'
import { Dialog, DialogContent } from '@spotcare/ui/components/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@spotcare/ui/components/sheet'
import { Badge } from '@spotcare/ui/components/badge'
import { Button } from '@spotcare/ui/components/button'
import { Separator } from '@spotcare/ui/components/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@spotcare/ui/components/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@spotcare/ui/components/table'
import { toast } from 'sonner'
import { updateComplaintStatus, type ComplaintWithFacility } from '@/app/actions/complaint'
import type { Complaint } from '@/types/database'

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

const STATUS_VARIANT: Record<Complaint['status'], 'secondary' | 'default' | 'outline'> = {
  received: 'secondary',
  in_progress: 'default',
  resolved: 'outline',
}

const NEXT_STATUS: Partial<Record<Complaint['status'], Complaint['status']>> = {
  received: 'in_progress',
  in_progress: 'resolved',
}

// -----------------------------------------------------------------------------
// 상세 Sheet 내용
// -----------------------------------------------------------------------------

function ComplaintDetailView({
  complaint: initial,
  facilityName,
  onBack,
  onStatusChange,
}: {
  complaint: Complaint
  facilityName: string
  onBack: () => void
  onStatusChange: (id: string, status: Complaint['status']) => void
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
      const updated = {
        ...complaint,
        status: nextStatus,
        resolved_at: nextStatus === 'resolved' ? new Date().toISOString() : null,
      }
      setComplaint(updated)
      onStatusChange(complaint.id, nextStatus)
      toast.success(`"${STATUS_LABEL[nextStatus]}"으로 변경되었습니다.`)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <Dialog open={!!lightbox} onOpenChange={(o) => { if (!o) setLightbox(null) }}>
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

        <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">민원 정보</p>
            <Badge variant={STATUS_VARIANT[complaint.status]} className="text-xs">
              {STATUS_LABEL[complaint.status]}
            </Badge>
          </div>
          <p className="text-sm font-medium">{facilityName}</p>
          <p className="text-sm text-muted-foreground">{complaint.complaint_type}</p>
          <p className="text-xs text-muted-foreground">접수: {formatDateTime(complaint.created_at)}</p>
          {complaint.resolved_at && (
            <p className="text-xs text-muted-foreground">완료: {formatDateTime(complaint.resolved_at)}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">내용</p>
          <p className="text-sm whitespace-pre-wrap">{complaint.content}</p>
        </div>

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

        {nextStatus && (
          <>
            <Separator />
            <Button className="w-full" disabled={isPending} onClick={handleStatusChange}>
              {isPending ? '처리 중...' : `"${STATUS_LABEL[nextStatus]}"으로 변경`}
            </Button>
          </>
        )}
      </div>
    </>
  )
}

// -----------------------------------------------------------------------------
// 메인 컴포넌트
// -----------------------------------------------------------------------------

type Props = {
  workspaceName: string
  initialItems: ComplaintWithFacility[]
}

export function ComplaintsManager({ workspaceName, initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [selected, setSelected] = useState<ComplaintWithFacility | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleSelect = useCallback((item: ComplaintWithFacility) => {
    setSelected(item)
    setSheetOpen(true)
  }, [])

  const handleSheetClose = useCallback((open: boolean) => {
    setSheetOpen(open)
    if (!open) setSelected(null)
  }, [])

  const handleStatusChange = useCallback(
    (id: string, status: Complaint['status']) => {
      setItems((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status, resolved_at: status === 'resolved' ? new Date().toISOString() : null }
            : c
        )
      )
      if (selected?.id === id) {
        setSelected((prev) =>
          prev ? { ...prev, status, resolved_at: status === 'resolved' ? new Date().toISOString() : null } : prev
        )
      }
    },
    [selected]
  )

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base">
              {selected ? '민원 상세' : '민원 이력'}
            </SheetTitle>
          </SheetHeader>
          {selected && (
            <ComplaintDetailView
              complaint={selected}
              facilityName={selected.facility_name}
              onBack={() => setSelected(null)}
              onStatusChange={handleStatusChange}
            />
          )}
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader>
          <CardTitle>민원 이력</CardTitle>
          <CardDescription>
            {workspaceName} · 총 {items.length}건
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <MessageSquareText className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">아직 접수된 민원이 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시설명</TableHead>
                  <TableHead>접수일</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead className="hidden md:table-cell">내용</TableHead>
                  <TableHead className="text-right">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSelect(item)}
                  >
                    <TableCell className="font-medium">{item.facility_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(item.created_at)}
                    </TableCell>
                    <TableCell className="text-sm">{item.complaint_type}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                      {item.content}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={STATUS_VARIANT[item.status]} className="text-xs">
                        {STATUS_LABEL[item.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
