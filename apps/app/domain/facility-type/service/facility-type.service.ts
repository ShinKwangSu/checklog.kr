// =============================================================================
// facility-type 도메인 — service (비즈니스 로직)
// =============================================================================
//
// 비즈니스 규칙:
//   ① 생성 시 워크스페이스 소속을 검증한다.
//   ② 삭제 시 이 타입을 사용하는 활성 시설이 있으면 차단한다(참조 무결성).
//   (중복 이름 제약은 DB UNIQUE → repository 가 DomainError 로 번역)
// =============================================================================

import type { FacilityType, TypedSupabaseClient } from '@checklog/database'
import { DomainError } from '@/lib/domain-error'
import { facilityTypeRepository } from '../repository/facility-type.repository'
import type { FacilityTypeWriteInput } from '../types'

type Db = TypedSupabaseClient

export const facilityTypeService = {
  /** 워크스페이스 시설 타입 목록 */
  async listByWorkspace(
    supabase: Db,
    accountId: string,
    workspaceId: string
  ): Promise<FacilityType[]> {
    return facilityTypeRepository.findByWorkspace(supabase, { workspaceId, accountId })
  },

  /** 시설 타입 생성 (워크스페이스 소속 검증 → 삽입) */
  async create(
    supabase: Db,
    accountId: string,
    workspaceId: string,
    input: FacilityTypeWriteInput
  ): Promise<FacilityType> {
    const owned = await facilityTypeRepository.isWorkspaceOwned(supabase, {
      workspaceId,
      accountId,
    })
    if (!owned) throw new DomainError('워크스페이스를 찾을 수 없습니다.')

    return facilityTypeRepository.insert(supabase, {
      accountId,
      workspaceId,
      typeName: input.typeName,
    })
  },

  /** 시설 타입 수정 (대상 없으면 DomainError) */
  async update(
    supabase: Db,
    accountId: string,
    workspaceId: string,
    id: string,
    input: FacilityTypeWriteInput
  ): Promise<FacilityType> {
    const updated = await facilityTypeRepository.update(
      supabase,
      { id, workspaceId, accountId },
      { typeName: input.typeName }
    )
    if (!updated) throw new DomainError('시설 타입을 찾을 수 없습니다.')
    return updated
  },

  /** 시설 타입 삭제 (사용 중이면 차단 → 소프트 딜리트) */
  async remove(
    supabase: Db,
    accountId: string,
    workspaceId: string,
    id: string
  ): Promise<void> {
    const inUse = await facilityTypeRepository.countActiveFacilitiesUsingType(supabase, {
      facilityTypeId: id,
      accountId,
    })
    if (inUse > 0) {
      throw new DomainError(
        '이 타입을 사용하는 시설이 있어 삭제할 수 없습니다. 먼저 시설을 삭제하거나 타입을 변경해주세요.'
      )
    }

    await facilityTypeRepository.softDelete(supabase, { id, workspaceId, accountId })
  },
}
