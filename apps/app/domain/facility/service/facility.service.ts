// =============================================================================
// facility 도메인 — service (비즈니스 로직)
// =============================================================================
//
// 규칙:
// - repository 를 통해서만 DB 에 접근하고, Supabase 클라이언트는 주입받아 전달한다.
// - 비즈니스 규칙 위반은 DomainError 로 throw 한다(사용자 노출 메시지).
// - 격리에 필요한 accountId/workspaceId 는 인자로 받는다(액션이 인증에서 확보).
//
// 시설 특유의 비즈니스 규칙:
//   ① floor 는 워크스페이스 층수 범위 내 정수여야 하며 0(층 없음)은 불가.
//   ② facility_type_id 는 같은 워크스페이스/고객 소속 타입이어야 한다
//      (타 워크스페이스 타입으로 시설을 분류하는 것을 차단).
// =============================================================================

import type { Facility, FacilityWithChecklists, TypedSupabaseClient } from '@checklog/database'
import { DomainError } from '@/lib/domain-error'
import { facilityRepository } from '../repository/facility.repository'
import type { FacilityWriteInput } from '../types'

type Db = TypedSupabaseClient

/** 층수가 워크스페이스 범위 내 유효한 값인지 검증한다(0=층 없음은 불가). */
async function assertFloorInRange(
  supabase: Db,
  scope: { workspaceId: string; accountId: string },
  floor: number
): Promise<void> {
  const range = await facilityRepository.findWorkspaceFloorRange(supabase, scope)
  const valid = !!range && floor !== 0 && floor >= range.min_floor && floor <= range.max_floor
  if (!valid) throw new DomainError('유효하지 않은 층수입니다.')
}

/** 선택한 시설 타입이 이 워크스페이스/고객 소속인지 검증한다. */
async function assertFacilityTypeOwned(
  supabase: Db,
  params: { facilityTypeId: string; workspaceId: string; accountId: string }
): Promise<void> {
  const owned = await facilityRepository.isFacilityTypeOwned(supabase, params)
  if (!owned) throw new DomainError('올바른 시설 타입을 선택해주세요.')
}

export const facilityService = {
  /** 워크스페이스 시설 목록 */
  async listByWorkspace(
    supabase: Db,
    accountId: string,
    workspaceId: string
  ): Promise<FacilityWithChecklists[]> {
    return facilityRepository.findByWorkspace(supabase, { workspaceId, accountId })
  },

  /** 시설 단건 (없으면 DomainError) */
  async getById(supabase: Db, accountId: string, id: string): Promise<Facility> {
    const facility = await facilityRepository.findById(supabase, { id, accountId })
    if (!facility) throw new DomainError('시설을 찾을 수 없습니다.')
    return facility
  },

  /** 시설 생성 (층/타입 검증 → 삽입 → 점검표 연결) */
  async create(
    supabase: Db,
    accountId: string,
    workspaceId: string,
    input: FacilityWriteInput
  ): Promise<Facility> {
    const scope = { workspaceId, accountId }
    await assertFloorInRange(supabase, scope, input.floor)
    await assertFacilityTypeOwned(supabase, { ...scope, facilityTypeId: input.facilityTypeId })

    const facility = await facilityRepository.insert(supabase, {
      accountId,
      workspaceId,
      facilityTypeId: input.facilityTypeId,
      facilityName: input.facilityName,
      floor: input.floor,
      memo: input.memo,
    })

    if (input.checklistId) {
      await facilityRepository.replaceChecklistLink(supabase, {
        facilityId: facility.id,
        checklistId: input.checklistId,
        ...scope,
      })
    }

    return facility
  },

  /** 시설 수정 (층/타입 검증 → 수정 → 점검표 연결 전체 교체) */
  async update(
    supabase: Db,
    accountId: string,
    workspaceId: string,
    id: string,
    input: FacilityWriteInput
  ): Promise<Facility> {
    const scope = { workspaceId, accountId }
    await assertFloorInRange(supabase, scope, input.floor)
    await assertFacilityTypeOwned(supabase, { ...scope, facilityTypeId: input.facilityTypeId })

    const facility = await facilityRepository.update(
      supabase,
      { id, ...scope },
      {
        facilityTypeId: input.facilityTypeId,
        facilityName: input.facilityName,
        floor: input.floor,
        memo: input.memo,
      }
    )
    if (!facility) throw new DomainError('시설을 찾을 수 없습니다.')

    await facilityRepository.replaceChecklistLink(supabase, {
      facilityId: id,
      checklistId: input.checklistId,
      ...scope,
    })

    return facility
  },

  /** 시설 소프트 딜리트 */
  async remove(
    supabase: Db,
    accountId: string,
    workspaceId: string,
    id: string
  ): Promise<void> {
    await facilityRepository.softDelete(supabase, { id, workspaceId, accountId })
  },
}
