import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      {/* Sidebar on the right (RTL start side) */}
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">{children}</div>
      </main>
    </div>
  )
}
