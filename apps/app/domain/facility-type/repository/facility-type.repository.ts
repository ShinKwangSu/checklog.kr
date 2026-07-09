// =============================================================================
// facility-type 도메인 — repository (DB 접근)
// =============================================================================
//
// 규칙: facility.repository 와 동일(클라이언트 주입, account_id+workspace_id 이중
// 격리, 소프트 딜리트 필터, 인프라 에러 throw).
//
// UNIQUE(workspace_id, type_name) 위반(Postgres 23505)은 알려진 비즈니스 제약이므로
// 이 레이어에서 DomainError('이미 존재하는 타입 이름입니다.')로 번역한다.
// =============================================================================

import type { FacilityType, TypedSupabaseClient } from '@checklog/database'
import { DomainError } from '@/lib/domain-error'

type Db = TypedSupabaseClient

type Scope = { workspaceId: string; accountId: string }

const DUPLICATE_TYPE_MESSAGE = '이미 존재하는 타입 이름입니다.'

/** Postgres unique_violation(23505) 여부 */
function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

export const facilityTypeRepository = {
  /** 워크스페이스 시설 타입 목록 (생성순) */
  async findByWorkspace(supabase: Db, scope: Scope): Promise<FacilityType[]> {
    const { data, error } = await supabase
      .from('facility_types')
      .select('*')
      .eq('workspace_id', scope.workspaceId)
      .eq('account_id', scope.accountId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  /** 워크스페이스가 지정 고객 소속이며 활성인지 확인 */
  async isWorkspaceOwned(supabase: Db, scope: Scope): Promise<boolean> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', scope.workspaceId)
      .eq('account_id', scope.accountId)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    return !!data
  },

  /** 시설 타입 생성 (중복 이름 → DomainError) */
  async insert(
    supabase: Db,
    row: { accountId: string; workspaceId: string; typeName: string }
  ): Promise<FacilityType> {
    const { data, error } = await supabase
      .from('facility_types')
      .insert({
        account_id: row.accountId,
        workspace_id: row.workspaceId,
        type_name: row.typeName,
      })
      .select()
      .single()

    if (error) {
      if (isUniqueViolation(error)) throw new DomainError(DUPLICATE_TYPE_MESSAGE)
      throw error
    }
    return data
  },

  /** 시설 타입 수정 (중복 이름 → DomainError). 대상 없으면 null */
  async update(
    supabase: Db,
    params: { id: string } & Scope,
    patch: { typeName: string }
  ): Promise<FacilityType | null> {
    const { data, error } = await supabase
      .from('facility_types')
      .update({ type_name: patch.typeName })
      .eq('id', params.id)
      .eq('workspace_id', params.workspaceId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)
      .select()
      .maybeSingle()

    if (error) {
      if (isUniqueViolation(error)) throw new DomainError(DUPLICATE_TYPE_MESSAGE)
      throw error
    }
    return data ?? null
  },

  /** 이 타입을 사용하는 활성 시설 수 (삭제된 시설 제외) */
  async countActiveFacilitiesUsingType(
    supabase: Db,
    params: { facilityTypeId: string; accountId: string }
  ): Promise<number> {
    const { count, error } = await supabase
      .from('facilities')
      .select('id', { count: 'exact', head: true })
      .eq('facility_type_id', params.facilityTypeId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)

    if (error) throw error
    return count ?? 0
  },

  /** 소프트 딜리트 */
  async softDelete(supabase: Db, params: { id: string } & Scope): Promise<void> {
    const { error } = await supabase
      .from('facility_types')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('workspace_id', params.workspaceId)
      .eq('account_id', params.accountId)
      .is('deleted_at', null)

    if (error) throw error
  },
}
