-- =============================================================================
-- checklog.kr MVP — Migration 012
-- 민원 관리: complaints 테이블 + RLS 정책
-- =============================================================================
-- 민원 유형(complaint_type)은 앱 레이어 상수(COMPLAINT_TYPE_OPTIONS)로 관리.
-- "직접 입력" 선택 시 사용자 입력 텍스트를 저장해야 하므로 ENUM 대신 VARCHAR.
-- =============================================================================

-- 처리 상태 ENUM
CREATE TYPE complaint_status AS ENUM ('received', 'in_progress', 'resolved');

-- complaints 테이블
CREATE TABLE complaints (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id      UUID NOT NULL REFERENCES facilities(id),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  complaint_type   VARCHAR(100) NOT NULL,
  content          TEXT NOT NULL,
  photo_urls       TEXT[] NOT NULL DEFAULT '{}',
  status           complaint_status NOT NULL DEFAULT 'received',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at      TIMESTAMPTZ,
  deleted_at       TIMESTAMPTZ
);

-- 활성 민원 조회 최적화 인덱스 (tenant_id + facility_id 이중 필터 대응)
CREATE INDEX idx_complaints_active ON complaints (tenant_id, facility_id) WHERE deleted_at IS NULL;

-- RLS 활성화
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints FORCE ROW LEVEL SECURITY;

-- INSERT: anon 역할 허용 (비로그인 방문자 제출)
CREATE POLICY "anon_insert_complaints" ON complaints
  FOR INSERT TO anon
  WITH CHECK (true);

-- SELECT: 인증된 테넌트만, tenant_id 격리
CREATE POLICY "tenant_select_complaints" ON complaints
  FOR SELECT TO authenticated
  USING (tenant_id = app_current_tenant_id());

-- UPDATE: 인증된 테넌트만, tenant_id 격리
CREATE POLICY "tenant_update_complaints" ON complaints
  FOR UPDATE TO authenticated
  USING (tenant_id = app_current_tenant_id())
  WITH CHECK (tenant_id = app_current_tenant_id());

-- =============================================================================
-- END OF MIGRATION 012
-- =============================================================================
