// =============================================================================
// spotcare.kr MVP — Supabase 서버 클라이언트
// =============================================================================
//
// 두 종류의 클라이언트를 제공한다.
//
// 1) createClient() — service_role 키 사용 (RLS BYPASS, 서버 전용)
//    - 인증 컨텍스트(로그인/회원가입)에서 사용한다.
//    - 로그인 전에는 세션/테넌트가 없으므로 RLS-respecting 연결로는
//      tenants 행을 읽거나(이메일 조회) 새 tenant 를 insert 할 수 없다.
//    - tenants 테이블은 db-schema 설계상 RLS 미적용이며, password_hash 같은
//      민감 컬럼은 "서버에서만" SELECT 한다(클라이언트로 절대 노출 금지).
//    - service_role 키는 절대 클라이언트 번들에 포함되어선 안 된다.
//      이 파일은 'server-only' 로 보호한다.
//
// 주의: service_role 은 RLS 를 우회하므로, 멀티테넌트 데이터(workspaces 등)를
//       다루는 Server Action 에서는 반드시 코드 레벨에서 tenant_id 필터를
//       명시해야 한다(01_db_schema.md "tenant_id 접근 방법" 참조).
// =============================================================================

import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('환경변수 NEXT_PUBLIC_SUPABASE_URL 가 설정되지 않았습니다.')
}
if (!serviceRoleKey) {
  throw new Error('환경변수 SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다.')
}

/**
 * 서버 전용 Supabase 클라이언트(service_role).
 * 인증(로그인/회원가입) 등 세션이 없는 컨텍스트에서 tenants 테이블 접근에 사용한다.
 *
 * Auth.js authorize() 콜백은 Edge 가 아닌 Node 런타임에서 실행되므로
 * 매 호출마다 새 클라이언트를 생성해도 무방하다(세션 상태를 공유하지 않음).
 */
export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl!, serviceRoleKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
