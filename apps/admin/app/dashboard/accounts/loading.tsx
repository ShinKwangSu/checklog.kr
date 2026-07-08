// =============================================================================
// 고객 목록 로딩 스켈레톤
// =============================================================================
// Server Component 의 accountPrefetch.list await 동안 표시된다.
// AccountsTable 헤더(업체명/관리자명/이메일/전화번호/가입일/액션) 열 수와 동일하게 맞춘다.
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

export default function AccountsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-5 w-72" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-9 max-w-sm" />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>업체명</TableHead>
                <TableHead>관리자명</TableHead>
                <TableHead className="hidden md:table-cell">이메일</TableHead>
                <TableHead className="hidden md:table-cell">전화번호</TableHead>
                <TableHead className="hidden lg:table-cell">가입일</TableHead>
                <TableHead className="w-[120px] text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
