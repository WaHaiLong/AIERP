import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, Bell, Search, ChevronRight, LogOut } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuthStore } from '../../store/authStore'

const routeLabels: Record<string, string> = {
  '/': '仪表盘',
  '/inventory': '库存管理',
  '/sales': '销售管理',
  '/purchase': '采购管理',
  '/finance': '财务管理',
  '/hr': '人力资源',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, signOut } = useAuthStore()
  const location = useLocation()

  const currentPath = '/' + (location.pathname.split('/')[1] || '')
  const currentLabel = routeLabels[currentPath] || '页面'
  const displayName = user?.email?.split('@')[0] || '用户'
  const avatarChar = displayName[0]?.toUpperCase() || 'U'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f2f3f5' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center justify-between flex-shrink-0 bg-white px-5"
          style={{ height: 56, borderBottom: '1px solid #e5e6eb' }}
        >
          {/* Left: hamburger (mobile) + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden flex items-center justify-center rounded-md transition-colors"
              style={{ width: 32, height: 32, color: '#4E5969' }}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-1.5" style={{ fontSize: 14 }}>
              <span
                className="cursor-default"
                style={{ color: '#86909C' }}
              >
                首页
              </span>
              {currentPath !== '/' && (
                <>
                  <ChevronRight size={14} style={{ color: '#c9cdd4' }} />
                  <span style={{ color: '#1D2129', fontWeight: 500 }}>
                    {currentLabel}
                  </span>
                </>
              )}
              {currentPath === '/' && (
                <>
                  <ChevronRight size={14} style={{ color: '#c9cdd4' }} />
                  <span style={{ color: '#1D2129', fontWeight: 500 }}>
                    仪表盘
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: search, bell, user */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              className="flex items-center justify-center rounded-md transition-colors hover:bg-gray-100"
              style={{ width: 36, height: 36, color: '#4E5969' }}
            >
              <Search size={18} />
            </button>

            {/* Notification bell */}
            <button
              className="flex items-center justify-center rounded-md transition-colors hover:bg-gray-100 relative"
              style={{ width: 36, height: 36, color: '#4E5969' }}
            >
              <Bell size={18} />
              {/* Red dot */}
              <span
                className="absolute rounded-full"
                style={{
                  width: 7,
                  height: 7,
                  background: '#F53F3F',
                  top: 8,
                  right: 8,
                  border: '1.5px solid white',
                }}
              />
            </button>

            {/* Divider */}
            <div
              className="mx-2"
              style={{ width: 1, height: 20, background: '#e5e6eb' }}
            />

            {/* User avatar + dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-md px-2 transition-colors hover:bg-gray-100"
                style={{ height: 36 }}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
              >
                <div
                  className="flex items-center justify-center rounded-full text-white font-medium"
                  style={{
                    width: 28,
                    height: 28,
                    background: 'linear-gradient(135deg, #2B5AED 0%, #3C7EFF 100%)',
                    fontSize: 12,
                  }}
                >
                  {avatarChar}
                </div>
                <span
                  className="hidden sm:inline"
                  style={{ fontSize: 13, color: '#1D2129', fontWeight: 500 }}
                >
                  {displayName}
                </span>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-1 bg-white rounded-lg overflow-hidden"
                  style={{
                    width: 160,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    border: '1px solid #e5e6eb',
                    zIndex: 50,
                  }}
                >
                  <button
                    className="flex items-center gap-2 w-full px-4 transition-colors hover:bg-gray-50"
                    style={{ height: 40, fontSize: 13, color: '#4E5969' }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      signOut()
                    }}
                  >
                    <LogOut size={15} />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto" style={{ padding: 20 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
