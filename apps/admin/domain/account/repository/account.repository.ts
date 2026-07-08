// =============================================================================
// account 도메인 — repository (DB 접근)
// =============================================================================
//
// 규칙:
// - Supabase 클라이언트를 인자로 주입받는다. 내부에서 직접 생성하지 않는다.
// - 슈퍼어드민은 전역 권한이므로 account_id 필터를 적용하지 않는다(의도된 설계).
// - accounts.Row 는 AccountWithSecret(해시 포함)이므로 명시적 컬럼 지정으로
//   password_hash 누출을 차단한다.
// - 검색: company_name + email ILIKE.
// - 인프라 에러는 throw 한다(service 에서 비즈니스 의미로 변환).
// =============================================================================

import type { Account, Workspace, TypedSupabaseClient } from '@checklog/database'

type Db = TypedSupabaseClient

// password_hash 를 제외한 공개 컬럼만 선택한다.
const PUBLIC_COLUMNS = 'id, company_name, admin_name, phone, email, created_at'

/** 검색어를 ILIKE 패턴으로 안전하게 변환 (콤마/괄호는 .or() 구문 충돌 방지) */
function sanitizeSearch(search: string): string {
  return search.replace(/[,()%]/g, ' ').trim()
}

export const accountRepository = {
  /** 페이지네이션 목록 + 전체 카운트 (검색 옵션) */
  async findAll(
    supabase: Db,
    params: { page: number; pageSize: number; search?: string }
  ): Promise<{ accounts: Account[]; total: number }> {
    const from = (params.page - 1) * params.pageSize
    const to = from + params.pageSize - 1

    let query = supabase
      .from('accounts')
      .select(PUBLIC_COLUMNS, { count: 'exact' })
      .is('deleted_at', null)

    const search = params.search ? sanitizeSearch(params.search) : ''
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error
    return { accounts: (data ?? []) as Account[], total: count ?? 0 }
  },

  /** 단건 상세 — 워크스페이스 요약 조인 (password_hash 제외) */
  async findById(
    supabase: Db,
    accountId: string
  ): Promise<(Account & { workspaces: Workspace[] }) | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select(
        `${PUBLIC_COLUMNS}, workspaces(id, account_id, workspace_name, max_floor, min_floor, created_at)`
      )
      .eq('id', accountId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return (data as (Account & { workspaces: Workspace[] }) | null) ?? null
  },

  /** 수정 (업체명/관리자명/전화번호) — 변경 후 공개 컬럼만 반환 */
  async update(
    supabase: Db,
    accountId: string,
    input: { company_name?: string; admin_name?: string; phone?: string }
  ): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update(input)
      .eq('id', accountId)
      .is('deleted_at', null)
      .select(PUBLIC_COLUMNS)
      .single()

    if (error) throw error
    return data as Account
  },

  /**
   * 계정 소유 자식 엔티티를 전부 소프트 딜리트한다 (CLAUDE.md cascade soft delete 규칙).
   *
   * DB에는 ON DELETE CASCADE가 걸려 있지만 계정 삭제는 하드 딜리트가 아니라
   * UPDATE(deleted_at)이므로 FK CASCADE는 발동하지 않는다 — 코드에서 명시적으로
   * account_id 스코프 테이블(워크스페이스 이하 전부)을 순회하며 cascade soft delete 한다.
   * facility_checklists는 조인 테이블(deleted_at 없음)이라 제외한다.
   */
  async softDeleteChildren(supabase: Db, accountId: string): Promise<void> {
    const deletedAt = new Date().toISOString()

    const { error: workspacesError } = await supabase
      .from('workspaces')
      .update({ deleted_at: deletedAt })
      .eq('account_id', accountId)
      .is('deleted_at', null)
    if (workspacesError) throw workspacesError

    const { error: facilityTypesError } = await supabase
      .from('facility_types')
      .update({ deleted_at: deletedAt })
      .eq('account_id', accountId)
      .is('deleted_at', null)
    if (facilityTypesError) throw facilityTypesError

    const { error: facilitiesError } = await supabase
      .from('facilities')
      .update({ deleted_at: deletedAt })
      .eq('account_id', accountId)
      .is('deleted_at', null)
    if (facilitiesError) throw facilitiesError

    const { error: inspectorsError } = await supabase
      .from('inspectors')
      .update({ deleted_at: deletedAt })
      .eq('account_id', accountId)
      .is('deleted_at', null)
    if (inspectorsError) throw inspectorsError

    const { error: checklistsError } = await supabase
      .from('checklists')
      .update({ deleted_at: deletedAt })
      .eq('account_id', accountId)
      .is('deleted_at', null)
    if (checklistsError) throw checklistsError

    const { error: checklistItemsError } = await supabase
      .from('checklist_items')
      .update({ deleted_at: deletedAt })
      .eq('account_id', accountId)
      .is('deleted_at', null)
    if (checklistItemsError) throw checklistItemsError

    const { error: complaintsError } = await supabase
      .from('complaints')
      .update({ deleted_at: deletedAt })
      .eq('account_id', accountId)
      .is('deleted_at', null)
    if (complaintsError) throw complaintsError
  },

  /** 소프트 딜리트 (자식 엔티티는 softDeleteChildren으로 먼저 처리한 뒤 호출한다) */
  async delete(supabase: Db, accountId: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', accountId)
      .is('deleted_at', null)
    if (error) throw error
  },
}
