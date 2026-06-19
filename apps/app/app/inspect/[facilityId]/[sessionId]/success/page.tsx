// =============================================================================
// /inspect/[facilityId]/[sessionId]/success — 점검 완료 페이지
// =============================================================================

export default function InspectionSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">점검 완료</h1>
        <p className="text-sm text-muted-foreground">
          점검 결과가 저장됐습니다. 수고하셨습니다.
        </p>
      </div>
    </div>
  )
}
