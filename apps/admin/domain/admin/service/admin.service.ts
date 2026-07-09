// =============================================================================
// admin 도메인 — service (비즈니스 로직)
// =============================================================================
//
// 규칙:
// - repository 를 통해서만 DB 에 접근하고, Supabase 클라이언트는 주입받아 전달한다.
// - 도메인 DTO(AdminDto) 로만 외부에 반환한다(password_hash 노출 금지).
// - 비즈니스 에러는 사용자 친화 메시지로 throw 한다.
// =============================================================================

import { randomBytes } from 'node:crypto'
import type { TypedSupabaseClient } from '@checklog/database'
import bcrypt from 'bcryptjs'
import { DomainError } from '@/lib/domain-error'
import { adminRepository } from '../repository/admin.repository'
import { toAdminDto } from '../mapper/admin.mapper'
import type {
  AdminDto,
  AdminListDto,
  CreateAdminInput,
  CreatedAdminDto,
  UpdateAdminInput,
} from '../types'

type Db = TypedSupabaseClient

const PAGE_SIZE = 20
const SALT_ROUNDS = 10

/**
 * 예측 불가능한 1회용 임시 비밀번호 생성 (base64url 12자).
 * 과거 고정값('12341234')은 생성 직후 창에서 누구나 로그인 가능한 위험이 있어,
 * 계정마다 랜덤값을 발급하고 생성 결과로 1회 반환한다(관리자가 최초 로그인 후 변경).
 */
function generateTempPassword(): string {
  return randomBytes(9).toString('base64url')
}

export const adminService = {
  /** 어드민 목록 (페이지네이션 20건 단위) */
  async listAdmins(supabase: Db, page = 1): Promise<AdminListDto> {
    const safePage = page < 1 ? 1 : page
    const { admins, total } = await adminRepository.findAll(supabase, {
      page: safePage,
      pageSize: PAGE_SIZE,
    })
    return {
      admins: admins.map(toAdminDto),
      total,
      page: safePage,
      pageSize: PAGE_SIZE,
    }
  },

  /** 어드민 단건 조회 */
  async getAdmin(supabase: Db, id: string): Promise<AdminDto> {
    const admin = await adminRepository.findById(supabase, id)
    if (!admin) throw new DomainError('어드민 계정을 찾을 수 없습니다.')
    return toAdminDto(admin)
  },

  /**
   * 어드민 생성.
   * 계정마다 랜덤 임시 비밀번호를 발급해 bcrypt 해싱 후 저장하고, 평문 임시 비밀번호를
   * 생성 결과로 1회 반환한다(관리자가 신규 어드민에게 전달, 최초 로그인 후 변경).
   * 이메일 중복 시 비즈니스 에러를 던진다.
   */
  async createAdmin(
    supabase: Db,
    input: CreateAdminInput
  ): Promise<CreatedAdminDto> {
    const existing = await adminRepository.findByEmail(supabase, input.email)
    if (existing) throw new DomainError('이미 사용 중인 이메일입니다.')

    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS)
    const created = await adminRepository.create(supabase, {
      email: input.email,
      name: input.name,
      password_hash: passwordHash,
    })
    return { admin: toAdminDto(created), tempPassword }
  },

  /**
   * 어드민 수정 (이름/이메일만).
   * 이메일 변경 시 타 계정과의 중복을 검증한다.
   */
  async updateAdmin(
    supabase: Db,
    id: string,
    input: UpdateAdminInput
  ): Promise<AdminDto> {
    const target = await adminRepository.findById(supabase, id)
    if (!target) throw new DomainError('어드민 계정을 찾을 수 없습니다.')

    if (input.email && input.email !== target.email) {
      const duplicate = await adminRepository.findByEmail(supabase, input.email)
      if (duplicate && duplicate.id !== id) {
        throw new DomainError('이미 사용 중인 이메일입니다.')
      }
    }

    const updated = await adminRepository.update(supabase, id, {
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
    })
    return toAdminDto(updated)
  },

  /**
   * 어드민 삭제.
   * 본인 계정은 삭제할 수 없다(requestingAdminId 와 동일하면 차단).
   */
  async deleteAdmin(
    supabase: Db,
    id: string,
    requestingAdminId: string
  ): Promise<void> {
    if (id === requestingAdminId) {
      throw new DomainError('본인 계정은 삭제할 수 없습니다.')
    }
    const target = await adminRepository.findById(supabase, id)
    if (!target) throw new DomainError('어드민 계정을 찾을 수 없습니다.')

    await adminRepository.delete(supabase, id)
  },

  /**
   * 비밀번호 변경.
   * 현재 비밀번호를 검증한 후 새 비밀번호를 해싱하여 저장한다.
   */
  async changePassword(
    supabase: Db,
    adminId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const admin = await adminRepository.findSecretById(supabase, adminId)
    if (!admin) throw new DomainError('어드민 계정을 찾을 수 없습니다.')

    const matched = await bcrypt.compare(currentPassword, admin.password_hash)
    if (!matched) throw new DomainError('현재 비밀번호가 올바르지 않습니다.')

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await adminRepository.updatePassword(supabase, adminId, newHash)
  },
}
