import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Truck,
  CreditCard, Users, LogOut, X
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const menuGroups = [
  {
    title: '业务管理',
    items: [
      { to: '/', icon: LayoutDashboard, label: '仪表盘' },
      { to: '/inventory', icon: Package, label: '库存管理' },
      { to: '/sales', icon: ShoppingCart, label: '销售管理' },
      { to: '/purchase', icon: Truck, label: '采购管理' },
    ],
  },
  {
    title: '企业管理',
    items: [
      { to: '/finance', icon: CreditCard, label: '财务管理' },
      { to: '/hr', icon: Users, label: '人力资源' },
    ],
  },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, signOut } = useAuthStore()

  const displayName = user?.email?.split('@')[0] || '用户'
  const avatarChar = displayName[0]?.toUpperCase() || 'U'
  const roleLabel = user?.role === 'admin' ? '管理员' : user?.role === 'manager' ? '经理' : '员工'

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full flex flex-col z-30
          transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
        style={{
          width: 220,
          background: 'linear-gradient(180deg, #0f1923 0%, #1a2738 100%)',
        }}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-5 flex-shrink-0" style={{ height: 56 }}>
          <div className="flex items-center gap-3">
            {/* Brand icon block */}
            <div
              className="flex items-center justify-center rounded-lg text-white font-bold"
              style={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #2B5AED 0%, #3C7EFF 100%)',
                fontSize: 14,
              }}
            >
              AI
            </div>
            <div>
              <div className="text-white font-semibold" style={{ fontSize: 16, lineHeight: '20px' }}>
                AI-ERP
              </div>
              <div style={{ fontSize: 11, lineHeight: '14px', color: '#5a6d85' }}>
                企业管理云平台
              </div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-2">
              {/* Group title */}
              <div
                className="px-3 pt-3 pb-2 uppercase tracking-wider"
                style={{ fontSize: 12, color: '#4a5568', fontWeight: 500 }}
              >
                {group.title}
              </div>

              {/* Menu items */}
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={onClose}
                  className="block mb-0.5"
                >
                  {({ isActive }) => (
                    <div
                      className="flex items-center gap-3 rounded-md transition-all duration-150"
                      style={{
                        height: 40,
                        paddingLeft: isActive ? 13 : 16,
                        paddingRight: 12,
                        background: isActive ? 'rgba(43,90,237,0.15)' : 'transparent',
                        borderLeft: isActive ? '3px solid #2B5AED' : '3px solid transparent',
                        color: isActive ? '#ffffff' : '#8b9bb4',
                        fontSize: 14,
                        fontWeight: isActive ? 500 : 400,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                          e.currentTarget.style.color = '#c5d0e0'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#8b9bb4'
                        }
                      }}
                    >
                      <Icon size={18} style={{ flexShrink: 0 }} />
                      <span>{label}</span>
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-4" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* User area */}
        <div className="px-4 py-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            {/* Avatar */}
            <div
              className="flex items-center justify-center rounded-full text-white font-medium flex-shrink-0"
              style={{
                width: 34,
                height: 34,
                background: 'linear-gradient(135deg, #2B5AED 0%, #3C7EFF 100%)',
                fontSize: 14,
              }}
            >
              {avatarChar}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="truncate text-white"
                style={{ fontSize: 13, lineHeight: '18px', fontWeight: 500 }}
              >
                {displayName}
              </div>
              <span
                className="inline-block rounded px-1.5 mt-0.5"
                style={{
                  fontSize: 11,
                  lineHeight: '18px',
                  color: '#3C7EFF',
                  background: 'rgba(43,90,237,0.15)',
                }}
              >
                {roleLabel}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 w-full rounded-md transition-colors duration-150"
            style={{
              height: 34,
              paddingLeft: 12,
              fontSize: 13,
              color: '#5a6d85',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#e5e7eb'
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#5a6d85'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <LogOut size={15} />
            退出登录
          </button>
        </div>
      </aside>
    </>
  )
}
