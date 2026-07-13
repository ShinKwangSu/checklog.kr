-- =============================================================================
-- checklog.kr MVP — 019_account_status_and_token_purpose.sql
-- 회원가입 이메일 인증을 위한 accounts.status 추가 + password_reset_tokens를
-- 이메일 인증 토큰까지 겸용하도록 purpose 컬럼 추가.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- accounts.status — pending(가입 직후) → active(이메일 인증 완료).
--   suspended는 컬럼만 미리 마련해둔다(탈퇴 기능은 추후 구현).
--   기존 가입자는 이메일 확인 절차 없이 가입했으므로 소급 차단하지 않도록
--   기본값을 active로 둔다. 신규 가입 코드는 INSERT 시 status='pending'을
--   명시적으로 지정한다.
-- -----------------------------------------------------------------------------
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('pending', 'active', 'suspended'));

-- -----------------------------------------------------------------------------
-- password_reset_tokens.purpose — 비밀번호 재설정 전용이던 토큰 테이블을
-- 이메일 인증 토큰까지 겸용한다. 기존 행은 전부 비밀번호 재설정 용도였으므로
-- 기본값으로 자연 백필된다.
-- -----------------------------------------------------------------------------
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'password_reset'
  CHECK (purpose IN ('password_reset', 'email_verification'));

-- 재전송 쿨다운/상한 조회(최근 N건) 최적화.
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_subject_recent
  ON password_reset_tokens (subject_type, subject_id, purpose, created_at DESC);

-- =============================================================================
-- END OF MIGRATION 019
-- =============================================================================
