import { useEffect, useState } from 'react'
import {
  Package,
  AlertTriangle,
  Users,
  Truck,
  ShoppingCart,
  TrendingUp,
  Package2,
  CreditCard,
  UserCheck,
  LayoutDashboard,
  RefreshCw,
} from 'lucide-react'
import StatCard from '../components/ui/StatCard'
import { getDashboardStats } from '../lib/db'
import type { DashboardStats } from '../types'

const formatCurrency = (amount: number): string =>
  `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDate = (date: Date): string =>
  date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-24" />
        <div className="h-7 bg-gray-200 rounded w-16" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDashboardStats()
      setStats(data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('无法加载仪表盘数据，请稍后重试。')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const statCards = stats
    ? [
        {
          title: '商品总数',
          value: stats.totalProducts,
          icon: Package,
          color: 'bg-blue-500',
        },
        {
          title: '低库存预警',
          value: stats.lowStockProducts,
          icon: AlertTriangle,
          color: 'bg-red-500',
        },
        {
          title: '客户数量',
          value: stats.totalCustomers,
          icon: Users,
          color: 'bg-green-500',
        },
        {
          title: '供应商数量',
          value: stats.totalSuppliers,
          icon: Truck,
          color: 'bg-purple-500',
        },
        {
          title: '销售订单',
          value: stats.salesOrdersCount,
          icon: ShoppingCart,
          color: 'bg-yellow-500',
        },
        {
          title: '销售总额',
          value: formatCurrency(stats.salesTotalAmount),
          icon: TrendingUp,
          color: 'bg-indigo-500',
        },
        {
          title: '采购订单',
          value: stats.purchaseOrdersCount,
          icon: Package2,
          color: 'bg-orange-500',
        },
        {
          title: '未收款项',
          value: formatCurrency(stats.unpaidInvoices),
          icon: CreditCard,
          color: 'bg-pink-500',
        },
        {
          title: '员工总数',
          value: stats.totalEmployees,
          icon: UserCheck,
          color: 'bg-teal-500',
        },
      ]
    : []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
            <p className="text-sm text-gray-500 mt-0.5">{formatDate(new Date())}</p>
          </div>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          刷新数据
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">数据加载失败</p>
            <p className="text-sm mt-0.5 text-red-600">{error}</p>
          </div>
          <button
            onClick={loadStats}
            className="ml-auto shrink-0 text-sm font-medium text-red-700 hover:text-red-900 underline underline-offset-2"
          >
            重试
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
              />
            ))}
      </div>
    </div>
  )
}
