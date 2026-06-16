'use client'

// =============================================================================
// spotcare.kr MVP — 시설 타입 관리 (Table + 생성/수정/삭제)
// =============================================================================
// 액션 시그니처:
//   createFacilityType(workspaceId, formData)
//   updateFacilityType(id, workspaceId, formData)
//   deleteFacilityType(id, workspaceId)
// 모두 ActionResult 반환. useTransition 으로 호출하고 toast 로 피드백.
// 삭제는 RESTRICT(사용 중 타입) 에러 메시지를 그대로 노출한다.
// =============================================================================

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import {
  createFacilityType,
  updateFacilityType,
  deleteFacilityType,
} from '@/app/actions/facility-type'
import {
  facilityTypeSchema,
  type FacilityTypeInput,
} from '@/lib/validations/facility-type'
import type { FacilityType } from '@/types/database'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@spotcare/ui/components/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@spotcare/ui/components/form'
import { Button } from '@spotcare/ui/components/button'
import { Input } from '@spotcare/ui/components/input'
import { ConfirmDeleteButton } from '@/components/confirm-delete-button'

type Props = {
  workspaceId: string
  facilityTypes: FacilityType[]
}

export function FacilityTypeManager({ workspaceId, facilityTypes }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>시설 타입</CardTitle>
          <CardDescription>총 {facilityTypes.length}개의 타입</CardDescription>
        </div>
        <TypeFormDialog workspaceId={workspaceId} />
      </CardHeader>
      <CardContent>
        {facilityTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              아직 등록된 시설 타입이 없습니다. 먼저 타입을 추가하세요.
            </p>
            <TypeFormDialog workspaceId={workspaceId} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>타입 이름</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facilityTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">
                    {type.type_name}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TypeFormDialog
                        workspaceId={workspaceId}
                        facilityType={type}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="수정"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <ConfirmDeleteButton
                        onConfirm={() =>
                          deleteFacilityType(type.id, workspaceId)
                        }
                        title="시설 타입을 삭제하시겠습니까?"
                        description="이 타입을 사용하는 시설이 있으면 삭제할 수 없습니다."
                        successMessage="시설 타입을 삭제했습니다."
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function TypeFormDialog({
  workspaceId,
  facilityType,
  trigger,
}: {
  workspaceId: string
  facilityType?: FacilityType
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEdit = !!facilityType

  const form = useForm<FacilityTypeInput>({
    resolver: zodResolver(facilityTypeSchema),
    defaultValues: { type_name: facilityType?.type_name ?? '' },
  })

  function onSubmit(values: FacilityTypeInput) {
    const formData = new FormData()
    formData.set('type_name', values.type_name)

    startTransition(async () => {
      const result = isEdit
        ? await updateFacilityType(facilityType.id, workspaceId, formData)
        : await createFacilityType(workspaceId, formData)

      if (result.success) {
        toast.success(isEdit ? '타입을 수정했습니다.' : '타입을 추가했습니다.')
        setOpen(false)
        if (!isEdit) form.reset({ type_name: '' })
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next)
          form.reset({ type_name: facilityType?.type_name ?? '' })
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            타입 추가
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? '시설 타입 수정' : '시설 타입 추가'}
          </DialogTitle>
          <DialogDescription>
            시설을 분류할 카테고리 이름을 입력하세요. (예: 화장실, 회의실)
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>타입 이름</FormLabel>
                  <FormControl>
                    <Input placeholder="회의실" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? '저장 중...' : isEdit ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
