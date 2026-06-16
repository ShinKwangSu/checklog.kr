import { auth } from '@/auth'
import { getWorkspaces } from '@/app/actions/workspace'
import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@spotcare/ui/components/sidebar'
import { Separator } from '@spotcare/ui/components/separator'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, workspaces] = await Promise.all([auth(), getWorkspaces()])

  return (
    <SidebarProvider>
      <AppSidebar
        workspaces={workspaces.map((w) => ({
          id: w.id,
          workspace_name: w.workspace_name,
        }))}
        user={{
          name: session?.user?.name ?? '관리자',
          email: session?.user?.email ?? '',
        }}
      />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
