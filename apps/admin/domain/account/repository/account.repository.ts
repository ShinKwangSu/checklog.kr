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

/**
 * 검색어를 ILIKE 패턴으로 안전하게 변환한다.
 * .or() 는 문자열을 PostgREST 필터 DSL로 파싱하므로, 구조 문자와 LIKE 와일드카드를
 * 모두 제거해 필터 조작(인젝션)을 차단한다. service_role이 RLS를 우회하는 상태라
 * 필터 안전성이 특히 중요하다.
 *   - PostgREST 구조 문자: , ( ) *  (별표는 PostgREST에서 % 로 변환됨)
 *   - LIKE 와일드카드/이스케이프: % _ \
 * 길이도 상한을 둬 과도한 입력을 차단한다.
 */
function sanitizeSearch(search: string): string {
  return search
    .replace(/[,()*%_\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
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
   * 계정 + 자식 엔티티를 단일 트랜잭션으로 cascade 소프트 딜리트한다.
   *
   * DB에는 ON DELETE CASCADE가 걸려 있지만 계정 삭제는 하드 딜리트가 아니라
   * UPDATE(deleted_at)이므로 FK CASCADE는 발동하지 않는다. 과거에는 앱에서 자식
   * 테이블을 순차 UPDATE 했으나 각 문장이 개별 커밋되어 중간 실패 시 "부분 삭제"가
   * 영구히 남는 문제가 있었다 — 이를 Postgres 함수(migration 016 soft_delete_account)로
   * 옮겨 원자적으로 실행한다. 한 단계라도 실패하면 전체가 롤백된다.
   * facility_checklists는 조인 테이블(deleted_at 없음)이라 함수에서도 제외한다.
   */
  async softDeleteCascade(supabase: Db, accountId: string): Promise<void> {
    const { error } = await supabase.rpc('soft_delete_account', {
      p_account_id: accountId,
    })
    if (error) throw error
  },
}
