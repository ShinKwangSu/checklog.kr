-- =============================================================================
-- spotcare.kr MVP — Migration 008
-- inspection_sessions + inspection_results: QR 점검 세션/결과 저장
-- =============================================================================
-- 보안 모델:
--   inspection_sessions.id 는 gen_random_uuid() 로 생성된 UUIDv4.
--   추측 불가능한 UUID 가 일회성 토큰 역할을 한다.
--   RLS 미적용(의도적) — 공개 접근이 필요하나 service_role 서버 전용으로 통제.
--   anon/authenticated 역할 접근을 명시적으로 차단한다.
-- =============================================================================

-- inspection_sessions — QR 스캔 시 생성되는 5분 단위 점검 세션
CREATE TABLE IF NOT EXISTS inspection_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id  UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'completed', 'expired')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  completed_at TIMESTAMPTZ
);

COMMENT ON TABLE  inspection_sessions IS 'QR 스캔 시 생성되는 일회성 점검 세션. UUID가 토큰 역할을 함.';
COMMENT ON COLUMN inspection_sessions.status    IS 'active: 유효, completed: 제출됨, expired: 만료됨';
COMMENT ON COLUMN inspection_sessions.expires_at IS '생성 시각 + 5분. 이후 접근은 거부된다.';

CREATE INDEX IF NOT EXISTS idx_inspection_sessions_facility_id ON inspection_sessions(facility_id);
CREATE INDEX IF NOT EXISTS idx_inspection_sessions_expires_at  ON inspection_sessions(expires_at);

REVOKE ALL ON TABLE inspection_sessions FROM anon, authenticated;

-- inspection_results — 점검 제출 결과
CREATE TABLE IF NOT EXISTS inspection_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES inspection_sessions(id) ON DELETE CASCADE,
  facility_id  UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  item_results JSONB NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE  inspection_results IS '점검 제출 결과. item_results JSONB에 항목별 체크 여부를 저장한다.';
COMMENT ON COLUMN inspection_results.item_results IS '{ "<checklist_item_id>": true|false, ... }';

CREATE INDEX IF NOT EXISTS idx_inspection_results_session_id  ON inspection_results(session_id);
CREATE INDEX IF NOT EXISTS idx_inspection_results_facility_id ON inspection_results(facility_id);

REVOKE ALL ON TABLE inspection_results FROM anon, authenticated;

-- =============================================================================
-- END OF MIGRATION 008
-- =============================================================================
