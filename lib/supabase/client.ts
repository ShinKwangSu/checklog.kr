// =============================================================================
// spotcare.kr MVP — Supabase 브라우저 클라이언트
// =============================================================================
//
// 브라우저(Client Component)에서 사용하는 Supabase 클라이언트.
//
// - anon 키(NEXT_PUBLIC_*)만 사용한다. service_role 키는 절대 클라이언트
//   번들에 포함하지 않는다(서버 전용 — lib/supabase/server.ts 참조).
// - anon 키는 RLS 를 우회하지 않으므로, RLS 정책(tenant_id 격리)이 그대로
//   적용된다. 다만 set_config 로 app.current_tenant_id 를 주입하지 않으면
//   fail-closed(0행)가 되므로, 멀티테넌트 데이터 접근은 원칙적으로 Server
//   Action(server.ts)을 통해 수행한다.
// - 이 파일은 실시간 구독/공개 읽기 등 클라이언트 직접 접근이 필요할 때를
//   대비한 표준 진입점이다. MVP CRUD 는 Server Action 경유를 권장한다.
// =============================================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('환경변수 NEXT_PUBLIC_SUPABASE_URL 가 설정되지 않았습니다.')
}
if (!anonKey) {
  throw new Error('환경변수 NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다.')
}

/**
 * 브라우저 전용 Supabase 클라이언트(anon 키).
 * Client Component 에서 import 하여 사용한다.
 */
export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl!, anonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}
