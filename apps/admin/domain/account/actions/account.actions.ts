'use server'

// =============================================================================
// account 도메인 — Server Actions (진입점)
// =============================================================================
//
// 규칙:
// - 모든 액션 진입부에서 requireAdmin() 으로 인증을 강제한다.
// - 변경 액션: AccountActionResult 반환. 조회 액션: 실패 시 throw.
// - 입력은 Zod 로 검증한다.
// - Supabase 클라이언트(service_role)는 이 레이어에서만 생성해 service 로 주입한다.
// - 슈퍼어드민은 전역 권한이므로 account_id 필터가 없다(의도된 설계).
// =============================================================================

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { runAction } from '@/lib/action-result'
import { DomainError } from '@/lib/domain-error'
import { updateAccountSchema } from '../validations/account.validations'
import { accountService } from '../service/account.service'
import type {
  AccountActionResult,
  AccountDto,
  AccountDetailDto,
  AccountListDto,
} from '../types'

// -----------------------------------------------------------------------------
// 조회 액션 (실패 시 throw)
// -----------------------------------------------------------------------------

export async function getAccountsAction(
  page = 1,
  search?: string
): Promise<AccountListDto> {
  await requireAdmin()
  const supabase = createClient()
  return accountService.listAccounts(supabase, page, search)
}

export async function getAccountDetailAction(
  accountId: string
): Promise<AccountDetailDto> {
  await requireAdmin()
  const supabase = createClient()
  return accountService.getAccountDetail(supabase, accountId)
}

// -----------------------------------------------------------------------------
// 변경 액션 (AccountActionResult 반환)
// -----------------------------------------------------------------------------

export async function updateAccountAction(
  accountId: string,
  _prevState: AccountActionResult<AccountDto> | undefined,
  formData: FormData
): Promise<AccountActionResult<AccountDto>> {
  return runAction(async () => {
    await requireAdmin()
    const raw = {
      companyName: formData.get('companyName') ?? undefined,
      adminName: formData.get('adminName') ?? undefined,
      phone: formData.get('phone') ?? undefined,
    }
    const parsed = updateAccountSchema.safeParse(raw)
    if (!parsed.success) {
      throw new DomainError(
        parsed.error.errors[0]?.message ?? '입력값을 확인해주세요.'
      )
    }

    const supabase = createClient()
    return accountService.updateAccount(supabase, accountId, parsed.data)
  }, '고객 수정 중 오류가 발생했습니다.')
}

export async function deleteAccountAction(
  accountId: string
): Promise<AccountActionResult> {
  return runAction(async () => {
    await requireAdmin()
    const supabase = createClient()
    await accountService.deleteAccount(supabase, accountId)
  }, '고객 삭제 중 오류가 발생했습니다.')
}
