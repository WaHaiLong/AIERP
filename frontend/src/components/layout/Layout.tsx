import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuthStore } from '../../store/authStore'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthStore()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="hidden lg:block text-sm text-gray-500">
            企业资源规划系统 (ERP)
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-500 hover:text-gray-700 relative">
              <Bell size={20} />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.email?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
