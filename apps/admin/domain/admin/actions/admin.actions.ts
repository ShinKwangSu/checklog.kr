'use server'

// =============================================================================
// admin 도메인 — Server Actions (진입점)
// =============================================================================
//
// 규칙:
// - 모든 액션 진입부에서 requireAdmin() 으로 인증을 강제한다.
// - 변경 액션: AdminActionResult 반환. 조회 액션: 실패 시 throw.
// - 입력은 Zod 로 검증한다(클라이언트 검증만으로는 충분하지 않다).
// - Supabase 클라이언트(service_role)는 이 레이어에서만 생성해 service 로 주입한다.
// - 슈퍼어드민은 전역 권한이므로 account_id 필터가 없다.
// =============================================================================

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { runAction } from '@/lib/action-result'
import { DomainError } from '@/lib/domain-error'
import {
  createAdminSchema,
  updateAdminSchema,
  changePasswordSchema,
} from '../validations/admin.validations'
import { adminService } from '../service/admin.service'
import type {
  AdminActionResult,
  AdminDto,
  AdminListDto,
  CreatedAdminDto,
} from '../types'

// -----------------------------------------------------------------------------
// 조회 액션 (실패 시 throw)
// -----------------------------------------------------------------------------

export async function getAdminsAction(page = 1): Promise<AdminListDto> {
  await requireAdmin()
  const supabase = createClient()
  return adminService.listAdmins(supabase, page)
}

export async function getAdminAction(adminId: string): Promise<AdminDto> {
  await requireAdmin()
  const supabase = createClient()
  return adminService.getAdmin(supabase, adminId)
}

// -----------------------------------------------------------------------------
// 변경 액션 (AdminActionResult 반환)
// -----------------------------------------------------------------------------

export async function createAdminAction(
  _prevState: AdminActionResult<CreatedAdminDto> | undefined,
  formData: FormData
): Promise<AdminActionResult<CreatedAdminDto>> {
  return runAction(async () => {
    await requireAdmin()
    const parsed = createAdminSchema.safeParse({
      email: formData.get('email'),
      name: formData.get('name'),
    })
    if (!parsed.success) {
      throw new DomainError(
        parsed.error.errors[0]?.message ?? '입력값을 확인해주세요.'
      )
    }

    const supabase = createClient()
    return adminService.createAdmin(supabase, parsed.data)
  }, '어드민 생성 중 오류가 발생했습니다.')
}

export async function updateAdminAction(
  adminId: string,
  _prevState: AdminActionResult<AdminDto> | undefined,
  formData: FormData
): Promise<AdminActionResult<AdminDto>> {
  return runAction(async () => {
    await requireAdmin()
    const raw = {
      email: formData.get('email') ?? undefined,
      name: formData.get('name') ?? undefined,
    }
    const parsed = updateAdminSchema.safeParse(raw)
    if (!parsed.success) {
      throw new DomainError(
        parsed.error.errors[0]?.message ?? '입력값을 확인해주세요.'
      )
    }

    const supabase = createClient()
    return adminService.updateAdmin(supabase, adminId, parsed.data)
  }, '어드민 수정 중 오류가 발생했습니다.')
}

export async function deleteAdminAction(
  adminId: string
): Promise<AdminActionResult> {
  return runAction(async () => {
    const { adminId: requestingAdminId } = await requireAdmin()
    const supabase = createClient()
    await adminService.deleteAdmin(supabase, adminId, requestingAdminId)
  }, '어드민 삭제 중 오류가 발생했습니다.')
}

export async function changePasswordAction(
  _prevState: AdminActionResult | undefined,
  formData: FormData
): Promise<AdminActionResult> {
  return runAction(async () => {
    const { adminId } = await requireAdmin()
    const parsed = changePasswordSchema.safeParse({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword'),
    })
    if (!parsed.success) {
      throw new DomainError(
        parsed.error.errors[0]?.message ?? '입력값을 확인해주세요.'
      )
    }

    const supabase = createClient()
    await adminService.changePassword(
      supabase,
      adminId,
      parsed.data.currentPassword,
      parsed.data.newPassword
    )
  }, '비밀번호 변경 중 오류가 발생했습니다.')
}
