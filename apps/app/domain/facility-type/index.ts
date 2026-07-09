// =============================================================================
// facility-type 도메인 — Public API
// =============================================================================
// 외부(컴포넌트/페이지)에서는 이 진입점으로만 import 한다. deep import 금지.
// =============================================================================

export * from './types'
export {
  getFacilityTypes,
  createFacilityType,
  updateFacilityType,
  deleteFacilityType,
} from './actions/facility-type.actions'
