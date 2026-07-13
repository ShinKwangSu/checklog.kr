// =============================================================================
// admin auth 도메인 — service (비즈니스 로직)
// =============================================================================
// 비밀번호 재설정(찾기) 흐름을 담당한다. 로그인/로그아웃은 next-auth(signIn/
// signOut) 와 redirect 흐름에 강하게 결합되어 action 에 둔다.
// =============================================================================

import { DomainError } from "@/lib/domain-error";
import type { TypedSupabaseClient } from "@checklog/database";
import { sendPasswordResetEmail } from "@checklog/email";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { authRepository } from "../repository/auth.repository";

type Db = TypedSupabaseClient;

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30분
const RESEND_COOLDOWN_MS = 60 * 1000; // 60초
const RESEND_MAX_PER_HOUR = 5;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** 재전송 남용 방지. 최근 1시간 내 발송 이력으로 쿨다운(60초)과 시간당 상한(5회)을 검사한다. */
async function assertResendAllowed(
  supabase: Db,
  subjectId: string,
): Promise<void> {
  const sinceISO = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = await authRepository.listRecentTokenTimestamps(
    supabase,
    subjectId,
    sinceISO,
  );
  if (recent.length === 0) return;

  const latestElapsedMs = Date.now() - new Date(recent[0]).getTime();
  if (latestElapsedMs < RESEND_COOLDOWN_MS) {
    const remainingSec = Math.ceil(
      (RESEND_COOLDOWN_MS - latestElapsedMs) / 1000,
    );
    throw new DomainError(`${remainingSec}초 후 다시 시도해주세요.`);
  }
  if (recent.length >= RESEND_MAX_PER_HOUR) {
    throw new DomainError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
  }
}

export const authService = {
  /**
   * 비밀번호 재설정 요청.
   * 이메일 존재 여부와 무관하게 동일하게 반환한다(계정 열거 방지) —
   * 활성 어드민이 있을 때만 실제로 토큰을 생성하고 메일을 보낸다.
   */
  async requestPasswordReset(supabase: Db, email: string): Promise<void> {
    const admin = await authRepository.findActiveAdminByEmail(supabase, email);
    if (!admin) return;

    await assertResendAllowed(supabase, admin.id);

    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

    await authRepository.createPasswordResetToken(supabase, {
      subjectId: admin.id,
      tokenHash,
      expiresAt,
    });

    const baseUrl = process.env.AUTH_URL ?? "https://admin.checklog.kr";
    await sendPasswordResetEmail({
      to: admin.email,
      from:
        process.env.EMAIL_FROM ?? "CheckLog 관리자 포털 <noreply@checklog.kr>",
      productName: "CheckLog 관리자 포털",
      resetUrl: `${baseUrl}/reset-password?token=${token}`,
    });
  },

  /** 토큰을 검증하고 새 비밀번호로 갱신한 뒤 토큰을 소비 처리한다. */
  async resetPassword(
    supabase: Db,
    token: string,
    newPassword: string,
  ): Promise<void> {
    const tokenHash = hashToken(token);
    const found = await authRepository.findValidResetToken(supabase, tokenHash);
    if (!found) {
      throw new DomainError("유효하지 않거나 만료된 링크입니다.");
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await authRepository.updatePassword(
      supabase,
      found.subjectId,
      passwordHash,
    );
    await authRepository.consumeResetToken(supabase, found.id);
  },
};
