// =============================================================================
// account 도메인 — service (비즈니스 로직)
// =============================================================================
//
// 규칙:
// - repository 를 통해서만 DB 에 접근하고, Supabase 클라이언트는 주입받아 전달한다.
// - 도메인 DTO 로만 외부에 반환한다(password_hash 노출 금지).
// - 비즈니스 에러는 사용자 친화 메시지로 throw 한다.
// =============================================================================

import type { TypedSupabaseClient } from '@checklog/database'
import { accountRepository } from '../repository/account.repository'
import { toAccountDto, toAccountDetailDto } from '../mapper/account.mapper'
import type {
  AccountDto,
  AccountDetailDto,
  AccountListDto,
  UpdateAccountInput,
} from '../types'

type Db = TypedSupabaseClient

const PAGE_SIZE = 20

export const accountService = {
  /** 고객 목록 (검색 + 페이지네이션 20건 단위) */
  async listAccounts(
    supabase: Db,
    page = 1,
    search?: string
  ): Promise<AccountListDto> {
    const safePage = page < 1 ? 1 : page
    const { accounts, total } = await accountRepository.findAll(supabase, {
      page: safePage,
      pageSize: PAGE_SIZE,
      search,
    })
    return {
      accounts: accounts.map(toAccountDto),
      total,
      page: safePage,
      pageSize: PAGE_SIZE,
    }
  },

  /** 고객 상세 (기본 정보 + 워크스페이스 목록) */
  async getAccountDetail(
    supabase: Db,
    accountId: string
  ): Promise<AccountDetailDto> {
    const account = await accountRepository.findById(supabase, accountId)
    if (!account) throw new Error('고객을 찾을 수 없습니다.')
    return toAccountDetailDto(account)
  },

  /** 고객 수정 (업체명/관리자명/전화번호) */
  async updateAccount(
    supabase: Db,
    accountId: string,
    input: UpdateAccountInput
  ): Promise<AccountDto> {
    const updated = await accountRepository.update(supabase, accountId, {
      ...(input.companyName !== undefined
        ? { company_name: input.companyName }
        : {}),
      ...(input.adminName !== undefined ? { admin_name: input.adminName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
    })
    return toAccountDto(updated)
  },

  /** 고객 삭제 (연관 데이터는 DB FK CASCADE) */
  async deleteAccount(supabase: Db, accountId: string): Promise<void> {
    await accountRepository.delete(supabase, accountId)
  },

  /** 전체 고객 수 (대시보드용) */
  async countAccounts(supabase: Db): Promise<number> {
    return accountRepository.count(supabase)
  },
}
