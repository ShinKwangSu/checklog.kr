'use client'

// =============================================================================
// checklog.kr MVP — 점검 관리 클라이언트 컴포넌트
// =============================================================================

import { useState, useCallback, useMemo } from 'react'
import { ClipboardList, ArrowLeft, CheckCircle2, XCircle, MinusCircle, User, Phone } from 'lucide-react'
import { Dialog, DialogContent } from '@checklog/ui/components/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@checklog/ui/components/sheet'
import { Badge } from '@checklog/ui/components/badge'
import { Button } from '@checklog/ui/components/button'
import { Skeleton } from '@checklog/ui/components/skeleton'
import { Separator } from '@checklog/ui/components/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@checklog/ui/components/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@checklog/ui/components/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@checklog/ui/components/table'
import { getInspectionDetail, type InspectionHistoryDetail, type WorkspaceInspectionHistoryItem } from '@/app/actions/inspection'
import { formatPhone, rawPhone } from '@/lib/utils/phone'

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

// -----------------------------------------------------------------------------
// 상세 Sheet 내용
// -----------------------------------------------------------------------------

function InspectionDetailView({
  item,
  onBack,
}: {
  item: WorkspaceInspectionHistoryItem
  onBack: () => void
}) {
  const [detail, setDetail] = useState<InspectionHistoryDetail | null | 'loading'>('loading')
  const [lightbox, setLightbox] = useState<string | null>(null)

  useState(() => {
    getInspectionDetail(item.session_id, item.facility_id).then(setDetail)
  })

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

        {detail === 'loading' ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !detail ? (
          <p className="text-sm text-muted-foreground">점검 정보를 불러올 수 없습니다.</p>
        ) : (
          <>
            <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">점검 정보</p>
              <p className="text-sm font-medium">{item.facility_name}</p>
              <p className="text-sm">{formatDateTime(detail.submitted_at)}</p>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {detail.inspector_name ?? '점검자 미상'}
                </span>
                {detail.inspector_phone && (
                  <a
                    href={`tel:${rawPhone(detail.inspector_phone)}`}
                    className="flex items-center gap-1.5 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {formatPhone(detail.inspector_phone)}
                  </a>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">점검 항목</p>
              {detail.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">점검 항목 정보가 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {detail.items.map((item) => (
                    <li key={item.id} className="rounded-md border px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate text-sm">{item.item_name}</span>
                          {item.is_required && (
                            <span className="shrink-0 text-xs text-muted-foreground">(필수)</span>
                          )}
                        </div>
                        <div className="shrink-0">
                          {item.response_type === 'photo' ? (
                            typeof item.result === 'string' && item.result ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <MinusCircle className="h-5 w-5 text-muted-foreground/40" />
                            )
                          ) : item.result === true ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : item.result === false ? (
                            <XCircle className="h-5 w-5 text-destructive" />
                          ) : (
                            <MinusCircle className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>
                      </div>
                      {item.response_type === 'photo' && typeof item.result === 'string' && item.result && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.result}
                          alt={item.item_name}
                          className="w-full h-auto rounded-md cursor-pointer"
                          onClick={() => setLightbox(item.result as string)}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
  items: WorkspaceInspectionHistoryItem[]
}

export function InspectionsManager({ workspaceName, items }: Props) {
  const [selected, setSelected] = useState<WorkspaceInspectionHistoryItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [facilityFilter, setFacilityFilter] = useState<string>('__all__')

  const facilities = useMemo(() => {
    const map = new Map<string, string>()
    items.forEach((i) => map.set(i.facility_id, i.facility_name))
    return Array.from(map, ([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [items])

  const filtered = useMemo(
    () => facilityFilter === '__all__' ? items : items.filter((i) => i.facility_id === facilityFilter),
    [items, facilityFilter]
  )

  const handleSelect = useCallback((item: WorkspaceInspectionHistoryItem) => {
    setSelected(item)
    setSheetOpen(true)
  }, [])

  const handleSheetClose = useCallback((open: boolean) => {
    setSheetOpen(open)
    if (!open) setSelected(null)
  }, [])

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base">
              {selected ? '점검 상세' : '점검 이력'}
            </SheetTitle>
          </SheetHeader>
          {selected && (
            <InspectionDetailView
              item={selected}
              onBack={() => setSelected(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle>점검 이력</CardTitle>
              <CardDescription>
                {workspaceName} · {facilityFilter === '__all__' ? `총 ${items.length}건` : `${filtered.length}건 / 전체 ${items.length}건`}
              </CardDescription>
            </div>
            {facilities.length > 1 && (
              <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">전체 시설</SelectItem>
                  {facilities.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <ClipboardList className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">아직 점검 이력이 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시설명</TableHead>
                  <TableHead>점검일시</TableHead>
                  <TableHead>점검자</TableHead>
                  <TableHead className="text-right">결과</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow
                    key={item.session_id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSelect(item)}
                  >
                    <TableCell className="font-medium">{item.facility_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(item.submitted_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.inspector_name ?? '미상'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.total_count > 0 ? (
                        <div className="flex justify-end gap-1.5">
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {item.pass_count}
                          </Badge>
                          {item.fail_count > 0 && (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <XCircle className="h-3 w-3" />
                              {item.fail_count}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
