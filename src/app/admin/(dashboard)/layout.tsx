import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminMobileHeader } from '@/components/admin/AdminMobileHeader'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      {/* Desktop sidebar (RTL start side) */}
      <AdminSidebar />

      {/* Content column: mobile top-bar + scrollable main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminMobileHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
