'use client'

// =============================================================================
// AccountsTable — 고객 목록 테이블 + 검색 + 페이지네이션 + 삭제
// =============================================================================
// nuqs 로 page/search URL 상태 관리, useAccounts(page, search) 로 데이터 소비.
// 검색은 로컬 입력값을 debounce 해 URL(search)에 반영하고 page 를 1로 리셋한다.
// 삭제는 확인 Dialog 후 useDeleteAccount() 뮤테이션.
// =============================================================================

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  useQueryState,
  parseAsInteger,
  parseAsString,
} from 'nuqs'
import { toast } from 'sonner'
import { Eye, Search, Trash2 } from 'lucide-react'

import { useAccounts, useDeleteAccount, type AccountDto } from '@/domain/account'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { Pagination } from '@/components/pagination'
import { Button } from '@checklog/ui/components/button'
import { Input } from '@checklog/ui/components/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@checklog/ui/components/table'
import { Skeleton } from '@checklog/ui/components/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@checklog/ui/components/dialog'

export function AccountsTable() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('')
  )

  // 로컬 입력값이 입력의 단일 소스다(URL→input 역동기화 없음 → 양방향 경쟁 제거).
  // 디바운스된 값만 단방향으로 URL(search)에 반영하고 page 를 1로 리셋한다.
  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearchInput = useDebouncedValue(searchInput, 300)

  useEffect(() => {
    const trimmed = debouncedSearchInput.trim()
    // 마운트 시(초기값 일치) 불필요한 page 리셋을 막는 가드.
    if (trimmed === search) return
    setSearch(trimmed || null)
    setPage(1)
  }, [debouncedSearchInput, search, setSearch, setPage])

  const { data, isLoading, isError } = useAccounts(page, search || undefined)
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount()

  const [target, setTarget] = useState<AccountDto | null>(null)

  const handleDelete = () => {
    if (!target) return
    deleteAccount(target.id, {
      onSuccess: (result) => {
        if (result.success) {
          toast.success('고객이 삭제되었습니다.')
          setTarget(null)
        } else {
          toast.error(result.error ?? '삭제에 실패했습니다.')
        }
      },
      onError: () => toast.error('삭제 중 오류가 발생했습니다.'),
    })
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="업체명 또는 이메일 검색"
          className="pl-9"
        />
      </div>

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
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-destructive"
                >
                  고객 목록을 불러오는 중 오류가 발생했습니다.
                </TableCell>
              </TableRow>
            ) : data && data.accounts.length > 0 ? (
              data.accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">
                    {account.companyName}
                  </TableCell>
                  <TableCell>{account.adminName}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {account.email}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {account.phone}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {new Date(account.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={`/dashboard/accounts/${account.id}`}
                          aria-label="상세"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="삭제"
                        onClick={() => setTarget(account)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {search
                    ? '검색 결과가 없습니다.'
                    : '등록된 고객이 없습니다.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(next) => setPage(next)}
      />

      <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>고객 삭제</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">
                {target?.companyName}
              </span>{' '}
              업체를 삭제하시겠습니까? 연관된 워크스페이스와 시설 데이터가 함께
              삭제되며 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTarget(null)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
