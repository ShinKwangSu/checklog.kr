-- =============================================================================
-- checklog.kr — Rename tenant → account (015)
-- =============================================================================
--
-- 목적: "tenant/테넌트" 명칭을 "account/고객"으로 전면 통일한다.
--       ALTER ... RENAME 계열만 사용하므로 데이터 손실 없이 무손실 리네임된다.
--       (Postgres는 컬럼/함수 rename 시 의존 객체(RLS 정책 등)를 OID 기준으로
--        자동 추적하므로 정책을 DROP/CREATE로 재작성할 필요가 없다.)
--
-- 주의: 이 마이그레이션을 적용하는 시점에 애플리케이션 코드도 함께 배포되어야
--       한다. 코드가 account_id/accounts를 참조하는데 DB가 아직 tenant_id/
--       tenants 상태거나 그 반대인 경우 전부 깨진다.
-- =============================================================================

-- =============================================================================
-- 1. 테이블 rename
-- =============================================================================
ALTER TABLE tenants RENAME TO accounts;

-- =============================================================================
-- 2. 컬럼 rename (tenant_id → account_id)
-- =============================================================================
ALTER TABLE workspaces          RENAME COLUMN tenant_id TO account_id;
ALTER TABLE facility_types      RENAME COLUMN tenant_id TO account_id;
ALTER TABLE facilities          RENAME COLUMN tenant_id TO account_id;
ALTER TABLE inspectors          RENAME COLUMN tenant_id TO account_id;
ALTER TABLE checklists          RENAME COLUMN tenant_id TO account_id;
ALTER TABLE checklist_items     RENAME COLUMN tenant_id TO account_id;
ALTER TABLE facility_checklists RENAME COLUMN tenant_id TO account_id;
ALTER TABLE complaints          RENAME COLUMN tenant_id TO account_id;

-- =============================================================================
-- 3. 인덱스 rename
-- =============================================================================
ALTER INDEX idx_workspaces_tenant_id          RENAME TO idx_workspaces_account_id;
ALTER INDEX idx_facility_types_tenant_id      RENAME TO idx_facility_types_account_id;
ALTER INDEX idx_facilities_tenant_id          RENAME TO idx_facilities_account_id;
ALTER INDEX idx_inspectors_tenant_id          RENAME TO idx_inspectors_account_id;
ALTER INDEX idx_checklists_tenant_id          RENAME TO idx_checklists_account_id;
ALTER INDEX idx_checklist_items_tenant_id     RENAME TO idx_checklist_items_account_id;
ALTER INDEX idx_facility_checklists_tenant_id RENAME TO idx_facility_checklists_account_id;
ALTER INDEX idx_tenants_active                RENAME TO idx_accounts_active;

-- =============================================================================
-- 4. RLS 헬퍼 함수 rename
--    (workspaces/facility_types/facilities 등의 정책 USING/WITH CHECK 절이
--     이 함수를 OID로 참조하므로, 함수 rename만으로 정책 재작성 없이 반영된다.)
-- =============================================================================
ALTER FUNCTION app_current_tenant_id() RENAME TO app_current_account_id;

COMMENT ON FUNCTION app_current_account_id() IS
  '세션/트랜잭션에 set_config 로 주입된 app.current_account_id 를 UUID 로 반환. 미설정 시 NULL(접근 차단).';

-- =============================================================================
-- 5. RLS 정책 rename
-- =============================================================================
ALTER POLICY tenant_isolation_workspaces          ON workspaces          RENAME TO account_isolation_workspaces;
ALTER POLICY tenant_isolation_facility_types      ON facility_types      RENAME TO account_isolation_facility_types;
ALTER POLICY tenant_isolation_facilities          ON facilities          RENAME TO account_isolation_facilities;
ALTER POLICY tenant_isolation_inspectors          ON inspectors          RENAME TO account_isolation_inspectors;
ALTER POLICY tenant_isolation_checklists          ON checklists          RENAME TO account_isolation_checklists;
ALTER POLICY tenant_isolation_checklist_items     ON checklist_items     RENAME TO account_isolation_checklist_items;
ALTER POLICY tenant_isolation_facility_checklists ON facility_checklists RENAME TO account_isolation_facility_checklists;
ALTER POLICY "tenant_select_complaints"           ON complaints          RENAME TO "account_select_complaints";
ALTER POLICY "tenant_update_complaints"           ON complaints          RENAME TO "account_update_complaints";

-- =============================================================================
-- 6. 코멘트 갱신
-- =============================================================================
COMMENT ON TABLE  accounts IS '마스터 계정/업체(고객). 멀티테넌트 격리의 최상위 루트.';
COMMENT ON COLUMN accounts.email         IS '로그인 식별자(고유).';
COMMENT ON COLUMN accounts.password_hash IS '평문 저장 금지. 해시만 저장.';

COMMENT ON COLUMN workspaces.account_id          IS 'RLS 격리용 FK. accounts(id) 참조.';
COMMENT ON COLUMN facility_types.account_id      IS 'RLS 격리용 비정규화 FK. 항상 workspace.account_id 와 일치해야 함.';
COMMENT ON COLUMN facilities.account_id          IS 'RLS 격리용 비정규화 FK. 항상 workspace.account_id 와 일치해야 함.';
COMMENT ON COLUMN inspectors.account_id          IS 'RLS 격리용 비정규화 FK.';
COMMENT ON COLUMN checklists.account_id          IS 'RLS 격리용 비정규화 FK.';
COMMENT ON COLUMN checklist_items.account_id     IS 'RLS 격리용 비정규화 FK.';

-- =============================================================================
-- END OF MIGRATION 015
-- =============================================================================
