// =============================================================================
// auth 도메인 — service (비즈니스 로직)
// =============================================================================
// 비밀번호 해싱(평문 저장 금지), 계정 생성/이메일 인증, 비밀번호 재설정을 담당한다.
// 로그인/로그아웃은 next-auth(signIn/signOut) 와 redirect 흐름에 강하게 결합되어
// action 에 둔다.
// =============================================================================

import { DomainError } from "@/lib/domain-error";
import type { TypedSupabaseClient } from "@checklog/database";
import {
  sendPasswordResetEmail,
  sendVerificationEmail as sendVerificationMail,
} from "@checklog/email";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { authRepository } from "../repository/auth.repository";
import type { SignUpInput } from "../types";

type Db = TypedSupabaseClient;

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30분
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24시간
const RESEND_COOLDOWN_MS = 60 * 1000; // 60초
const RESEND_MAX_PER_HOUR = 5;

const PRODUCT_NAME = "checklog.kr";
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "checklog.kr <noreply@checklog.kr>";
const BASE_URL = process.env.AUTH_URL ?? "https://app.checklog.kr";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * 재전송 남용 방지. 최근 1시간 내 발송 이력을 확인해 쿨다운(60초)과
 * 시간당 상한(5회)을 검사한다. 계정 존재 여부와 무관하게 호출부에서
 * "계정이 있을 때만" 호출하므로 이 자체가 계정 열거로 이어지진 않는다.
 */
async function assertResendAllowed(
  supabase: Db,
  subjectId: string,
  purpose: "password_reset" | "email_verification",
): Promise<void> {
  const sinceISO = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recent = await authRepository.listRecentTokenTimestamps(
    supabase,
    subjectId,
    purpose,
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
  /** 마스터 계정 등록 (비밀번호 해싱 후 저장, status='pending'으로 생성) */
  async registerAccount(
    supabase: Db,
    input: SignUpInput,
  ): Promise<{ id: string; email: string }> {
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const created = await authRepository.createAccount(supabase, {
      companyName: input.companyName,
      adminName: input.adminName,
      phone: input.phone,
      email: input.email,
      passwordHash,
    });
    return { id: created.id, email: input.email };
  },

  /**
   * 회원가입 오케스트레이션. 계정을 생성하고 인증 메일을 보낸다.
   * 이미 같은 이메일로 pending 상태 계정이 존재하면(가입 재시도) 새로 만들지 않고
   * 그 계정에 인증 메일을 재발송한다. 활성/정지 계정과 중복이면 그대로 에러를 던진다.
   */
  async signUp(supabase: Db, input: SignUpInput): Promise<{ email: string }> {
    try {
      const account = await authService.registerAccount(supabase, input);
      await authService.sendVerificationEmail(
        supabase,
        account.id,
        account.email,
      );
      return { email: account.email };
    } catch (e) {
      if (e instanceof DomainError) {
        const pending = await authRepository.findPendingAccountByEmail(
          supabase,
          input.email,
        );
        if (pending) {
          await authService.sendVerificationEmail(
            supabase,
            pending.id,
            pending.email,
          );
          return { email: pending.email };
        }
      }
      throw e;
    }
  },

  /**
   * 이메일 인증 메일 발송(신규 가입/재전송/이메일 수정 공용).
   * 재전송 남용 방지 쿨다운/상한을 검사한 뒤 토큰을 발급하고 메일을 보낸다.
   */
  async sendVerificationEmail(
    supabase: Db,
    accountId: string,
    email: string,
  ): Promise<void> {
    await assertResendAllowed(supabase, accountId, "email_verification");

    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION_TTL_MS,
    ).toISOString();

    await authRepository.createToken(supabase, {
      subjectId: accountId,
      purpose: "email_verification",
      tokenHash,
      expiresAt,
    });

    await sendVerificationMail({
      to: email,
      from: EMAIL_FROM,
      productName: PRODUCT_NAME,
      verifyUrl: `${BASE_URL}/verify-email?token=${token}`,
    });
  },

  /** 가입 인증 대기(pending) 계정에 인증 메일을 재전송한다. */
  async resendVerificationEmail(supabase: Db, email: string): Promise<void> {
    const account = await authRepository.findPendingAccountByEmail(
      supabase,
      email,
    );
    if (!account) {
      throw new DomainError("요청을 처리할 수 없습니다.");
    }
    await authService.sendVerificationEmail(
      supabase,
      account.id,
      account.email,
    );
  },

  /**
   * 가입 인증 대기 중 이메일 주소를 수정하고 새 주소로 인증 메일을 재발송한다.
   * 이전 주소로 발급됐던 미사용 인증 토큰은 폐기한다(잘못 보낸 주소의 링크가
   * 나중에 다른 사람 손에 들어가 계정을 활성화시키는 것을 방지).
   */
  async updateEmailAndResend(
    supabase: Db,
    currentEmail: string,
    newEmail: string,
  ): Promise<{ email: string }> {
    const account = await authRepository.findPendingAccountByEmail(
      supabase,
      currentEmail,
    );
    if (!account) {
      throw new DomainError("요청을 처리할 수 없습니다.");
    }

    await authRepository.updateAccountEmail(supabase, account.id, newEmail);
    await authRepository.invalidateTokens(
      supabase,
      account.id,
      "email_verification",
    );
    await authService.sendVerificationEmail(supabase, account.id, newEmail);

    return { email: newEmail };
  },

  /** 이메일 인증 토큰을 검증하고 계정을 활성화한다. */
  async verifyEmail(supabase: Db, token: string): Promise<void> {
    const tokenHash = hashToken(token);
    const found = await authRepository.findValidToken(
      supabase,
      tokenHash,
      "email_verification",
    );
    if (!found) {
      throw new DomainError("유효하지 않거나 만료된 링크입니다.");
    }

    await authRepository.activateAccount(supabase, found.subjectId);
    await authRepository.consumeToken(supabase, found.id);
  },

  /**
   * 비밀번호 재설정 요청.
   * 계정 존재 여부와 무관하게 동일하게 반환한다(이메일 존재 열거 방지) —
   * 활성 계정이 있을 때만 실제로 토큰을 생성하고 메일을 보낸다.
   */
  async requestPasswordReset(supabase: Db, email: string): Promise<void> {
    const account = await authRepository.findActiveAccountByEmail(
      supabase,
      email,
    );
    if (!account) return;

    await assertResendAllowed(supabase, account.id, "password_reset");

    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

    await authRepository.createToken(supabase, {
      subjectId: account.id,
      purpose: "password_reset",
      tokenHash,
      expiresAt,
    });

    await sendPasswordResetEmail({
      to: account.email,
      from: EMAIL_FROM,
      productName: PRODUCT_NAME,
      resetUrl: `${BASE_URL}/reset-password?token=${token}`,
    });
  },

  /** 토큰을 검증하고 새 비밀번호로 갱신한 뒤 해당 계정의 미사용 재설정 토큰을 전부 폐기한다. */
  async resetPassword(
    supabase: Db,
    token: string,
    newPassword: string,
  ): Promise<void> {
    const tokenHash = hashToken(token);
    const found = await authRepository.findValidToken(
      supabase,
      tokenHash,
      "password_reset",
    );
    if (!found) {
      throw new DomainError("유효하지 않거나 만료된 링크입니다.");
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await authRepository.updatePassword(
      supabase,
      found.subjectId,
      passwordHash,
    );
    await authRepository.invalidateTokens(
      supabase,
      found.subjectId,
      "password_reset",
    );
  },

  /**
   * 로그인 상태에서 현재 비밀번호를 검증한 후 새 비밀번호로 변경하고,
   * 해당 계정의 미사용 재설정 토큰을 전부 폐기한다(유출된 옛 재설정 링크 무력화).
   */
  async changePassword(
    supabase: Db,
    accountId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const account = await authRepository.findAccountSecretById(
      supabase,
      accountId,
    );
    if (!account) throw new DomainError("계정을 찾을 수 없습니다.");

    const matched = await bcrypt.compare(
      currentPassword,
      account.password_hash,
    );
    if (!matched) throw new DomainError("현재 비밀번호가 올바르지 않습니다.");

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await authRepository.updatePassword(supabase, accountId, newHash);
    await authRepository.invalidateTokens(
      supabase,
      accountId,
      "password_reset",
    );
  },

  /** 워크스페이스 생성 등 인증 완료가 필요한 기능의 접근을 가드한다. */
  async requireActiveAccount(supabase: Db, accountId: string): Promise<void> {
    const account = await authRepository.findAccountStatusById(
      supabase,
      accountId,
    );
    if (!account || account.status !== "active") {
      throw new DomainError(
        "이메일 인증 후 이용할 수 있습니다. 가입하신 이메일함을 확인해주세요.",
      );
    }
  },

  /**
   * 계정 활성화 여부를 조회한다(throw 없이 boolean 반환).
   * 워크스페이스 생성 버튼처럼 서버 컴포넌트에서 UI 노출 여부를 미리 판단할 때 쓴다.
   */
  async isAccountActive(supabase: Db, accountId: string): Promise<boolean> {
    const account = await authRepository.findAccountStatusById(
      supabase,
      accountId,
    );
    return account?.status === "active";
  },
};
