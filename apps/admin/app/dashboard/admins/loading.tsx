// =============================================================================
// 어드민 목록 로딩 스켈레톤
// =============================================================================
// Server Component 의 adminPrefetch.list await 동안 표시된다.
// AdminsTable 헤더(이름/이메일/생성일/액션) 열 수와 동일하게 맞춘다.
// =============================================================================

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@checklog/ui/components/table'
import { Skeleton } from '@checklog/ui/components/skeleton'

export default function AdminsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead className="hidden md:table-cell">생성일</TableHead>
              <TableHead className="w-[140px] text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-40" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-8 w-28" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
