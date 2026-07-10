'use client'

// =============================================================================
// CreateAdminDialog — 어드민 생성 Dialog
// =============================================================================
// react-hook-form + zod 검증, useCreateAdmin() 뮤테이션(FormData).
// 성공 시 Dialog 닫기 + toast. 임시 비밀번호는 서버가 계정마다 랜덤 발급하며,
// 생성 결과로 1회만 반환되므로 toast 로 즉시 표시한다(관리자가 신규 어드민에게 전달).
// =============================================================================

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

import { useCreateAdmin, adminFormSchema } from '@/domain/admin'
import { Button } from '@checklog/ui/components/button'
import { Input } from '@checklog/ui/components/input'
import { Label } from '@checklog/ui/components/label'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormDialogContent as DialogContent,
} from '@/components/form-dialog'

type FormValues = z.infer<typeof adminFormSchema>

export function CreateAdminDialog() {
  const [open, setOpen] = useState(false)
  const { mutate: createAdmin, isPending } = useCreateAdmin()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: { name: '', email: '' },
  })

  const onSubmit = (values: FormValues) => {
    const formData = new FormData()
    formData.set('name', values.name)
    formData.set('email', values.email)

    createAdmin(formData, {
      onSuccess: (result) => {
        if (result.success && result.data) {
          toast.success(
            `어드민이 생성되었습니다. 임시 비밀번호: ${result.data.tempPassword}`,
            {
              description:
                '이 비밀번호는 다시 표시되지 않습니다. 신규 어드민에게 전달하고 최초 로그인 후 변경하도록 안내하세요.',
              duration: Infinity,
              closeButton: true,
            }
          )
          reset()
          setOpen(false)
        } else {
          toast.error(result.error ?? '생성에 실패했습니다.')
        }
      },
      onError: () => toast.error('생성 중 오류가 발생했습니다.'),
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          어드민 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>어드민 추가</DialogTitle>
            <DialogDescription>
              새 슈퍼어드민 계정을 생성합니다. 랜덤 임시 비밀번호가 발급되어 생성
              직후 1회 표시되며, 최초 로그인 후 변경해야 합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                placeholder="홍길동"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@checklog.kr"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
