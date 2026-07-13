-- =============================================================================
-- checklog.kr MVP — 018_password_reset_tokens.sql
-- 비밀번호 재설정 토큰 테이블 (apps/app accounts + apps/admin admins 공용).
-- =============================================================================

-- gen_random_uuid() 보장 (이미 활성화되었을 수 있으나 멱등하게 재명시)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- password_reset_tokens — 비밀번호 찾기(재설정) 1회용 토큰.
--   * subject_type + subject_id 로 accounts/admins 어느 쪽 계정인지 구분한다
--     (계정 종류별 테이블 분리 대신 하나로 공유).
--   * 토큰은 평문으로 저장하지 않는다. 이메일 링크에만 평문 토큰을 담고,
--     DB 에는 SHA-256 해시(token_hash)만 저장한다.
--   * expires_at 으로 TTL, consumed_at 으로 1회성을 보장한다(소프트 딜리트
--     대상 아님 — 삭제 가능한 엔티티가 아니라 만료성 데이터이므로 deleted_at
--     대신 TTL/consumed 패턴을 쓴다).
--   * 로그인 전(세션 없음) 단계에서 조회/삽입이 필요하므로 admins 와 동일하게
--     RLS 대신 anon/authenticated 권한 회수로 service_role 전용 접근만 허용한다.
-- -----------------------------------------------------------------------------
CREATE TABLE password_reset_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type  TEXT NOT NULL CHECK (subject_type IN ('account', 'admin')),
  subject_id    UUID NOT NULL,
  token_hash    TEXT NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 토큰 검증(SELECT by token_hash) 최적화. 소비된 토큰은 다시 조회할 필요가
-- 없으므로 부분 인덱스로 활성 토큰만 인덱싱한다.
CREATE INDEX idx_password_reset_tokens_lookup
  ON password_reset_tokens (token_hash) WHERE consumed_at IS NULL;

-- anon/authenticated 역할의 모든 접근 차단. service_role 전용 보장.
REVOKE ALL ON TABLE password_reset_tokens FROM anon, authenticated;

-- =============================================================================
-- END OF MIGRATION 018
-- =============================================================================
