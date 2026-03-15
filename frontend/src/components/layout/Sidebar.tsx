import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Truck,
  CreditCard, Users, Building2, LogOut, X, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const nav = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/inventory', icon: Package, label: '库存管理' },
  { to: '/sales', icon: ShoppingCart, label: '销售管理' },
  { to: '/purchase', icon: Truck, label: '采购管理' },
  { to: '/finance', icon: CreditCard, label: '财务管理' },
  { to: '/hr', icon: Users, label: '人力资源' },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, signOut } = useAuthStore()

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 text-white flex flex-col z-30
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Building2 className="text-blue-400" size={22} />
            <span className="font-bold text-lg">AI-ERP</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors text-sm font-medium
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
              }
            >
              <Icon size={18} />
              {label}
              <ChevronRight size={14} className="ml-auto opacity-50" />
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 mb-1">{user?.email}</div>
          <div className="text-xs text-blue-400 mb-3 capitalize">{user?.role}</div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>
    </>
  )
}
