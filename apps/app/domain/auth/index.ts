// =============================================================================
// auth 도메인 — Public API
// =============================================================================
// 외부(컴포넌트/페이지)에서는 이 진입점으로만 import 한다. deep import 금지.
// =============================================================================
export * from './types'
export * from './hooks'
export {
  signUpAction,
  loginAction,
  logoutAction,
  requestPasswordResetAction,
  resetPasswordAction,
  changePasswordAction,
  resendVerificationEmailAction,
  updateEmailAction,
  verifyEmailAction,
} from './actions/auth.actions'
export { changePasswordSchema } from './validations/auth.validations'
// authService(requireActiveAccount 등)는 이 배럴에서 export하지 않는다 — service 파일이
// server-only 이메일 발송 코드를 물고 있어서, 배럴을 통해 export하면 nav-user.tsx 같은
// 클라이언트 컴포넌트가 barrel(logoutAction 등)을 import할 때 server-only 코드까지
// 클라이언트 번들에 딸려 들어가 빌드가 깨진다. 서버 전용 코드(workspace.actions.ts 등)는
// service 파일을 deep import 로 직접 가져다 쓴다.
