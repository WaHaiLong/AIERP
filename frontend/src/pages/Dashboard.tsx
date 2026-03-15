import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  AlertTriangle,
  Users,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Search,
  FileText,
  Truck,
  CreditCard,
  UserCheck,
  BarChart3,
  ClipboardList,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { getDashboardStats } from '../lib/db'
import { useAuthStore } from '../store/authStore'
import type { DashboardStats } from '../types'

const formatCurrency = (amount: number): string =>
  `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatCompact = (amount: number): string => {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const formatDate = (date: Date): string =>
  date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

const formatTime = (date: Date): string =>
  date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })

// Mock data for sales trend chart
const salesTrendData = [
  { month: '1月', sales: 42000, orders: 35 },
  { month: '2月', sales: 38000, orders: 28 },
  { month: '3月', sales: 55000, orders: 42 },
  { month: '4月', sales: 47000, orders: 38 },
  { month: '5月', sales: 63000, orders: 51 },
  { month: '6月', sales: 58000, orders: 45 },
  { month: '7月', sales: 72000, orders: 58 },
]

// Mock data for order status pie chart
const orderStatusData = [
  { name: '已完成', value: 45, color: '#00B42A' },
  { name: '进行中', value: 28, color: '#2B5AED' },
  { name: '待审核', value: 15, color: '#FF7D00' },
  { name: '已取消', value: 12, color: '#F53F3F' },
]

// Quick entry items
const quickEntries = [
  { label: '新建销售单', icon: Plus, color: '#2B5AED', bg: '#EDF1FE', path: '/sales' },
  { label: '新建采购单', icon: FileText, color: '#00B42A', bg: '#E8F7EB', path: '/purchase' },
  { label: '库存查询', icon: Search, color: '#FF7D00', bg: '#FFF3E0', path: '/inventory' },
  { label: '客户管理', icon: Users, color: '#7C3AED', bg: '#F0E6FE', path: '/sales' },
  { label: '供应商管理', icon: Truck, color: '#0FC6C2', bg: '#E0F7F6', path: '/purchase' },
  { label: '财务对账', icon: CreditCard, color: '#F53F3F', bg: '#FEECEC', path: '/finance' },
  { label: '员工花名册', icon: UserCheck, color: '#2B5AED', bg: '#EDF1FE', path: '/hr' },
  { label: '数据报表', icon: BarChart3, color: '#FF7D00', bg: '#FFF3E0', path: '/finance' },
]

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-7 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now] = useState(new Date())
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

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

  const dataCards = stats
    ? [
        {
          title: '商品总数',
          value: stats.totalProducts.toString(),
          accent: '#2B5AED',
          bg: '#EDF1FE',
          icon: Package,
          trend: '+12%',
          trendUp: true,
        },
        {
          title: '销售总额',
          value: formatCompact(stats.salesTotalAmount),
          accent: '#00B42A',
          bg: '#E8F7EB',
          icon: TrendingUp,
          trend: '+8.5%',
          trendUp: true,
        },
        {
          title: '销售订单',
          value: stats.salesOrdersCount.toString(),
          accent: '#FF7D00',
          bg: '#FFF3E0',
          icon: ShoppingCart,
          trend: '+5',
          trendUp: true,
        },
        {
          title: '低库存预警',
          value: stats.lowStockProducts.toString(),
          accent: '#F53F3F',
          bg: '#FEECEC',
          icon: AlertTriangle,
          trend: stats.lowStockProducts > 0 ? '需处理' : '正常',
          trendUp: stats.lowStockProducts === 0,
        },
      ]
    : []

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f2f3f5' }}>
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ===== Top Welcome Bar ===== */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#1D2129' }}>
              欢迎回来，{user?.full_name || '用户'}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#86909C' }}>
              {formatDate(now)} {formatTime(now)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/sales')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: '#2B5AED' }}
            >
              <Plus size={15} />
              新建订单
            </button>
            <button
              onClick={loadStats}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              style={{ color: '#4E5969', borderColor: '#E5E6EB' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              刷新
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4">
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

        {/* ===== Row 1: Data Overview Cards ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : dataCards.map((card) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.title}
                    className="bg-white rounded-xl p-5 shadow-sm transition hover:shadow-md"
                    style={{ borderRadius: '12px' }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Color block with icon */}
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: card.bg }}
                      >
                        <Icon size={20} style={{ color: card.accent }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: '#86909C' }}>
                          {card.title}
                        </p>
                        <p
                          className="text-2xl font-bold mt-0.5 truncate"
                          style={{ color: '#1D2129' }}
                        >
                          {card.value}
                        </p>
                      </div>
                    </div>
                    {/* Trend indicator */}
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: '#F2F3F5' }}>
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium"
                        style={{ color: card.trendUp ? '#00B42A' : '#F53F3F' }}
                      >
                        {card.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {card.trend}
                        <span style={{ color: '#86909C', marginLeft: 4 }}>较上月</span>
                      </span>
                    </div>
                  </div>
                )
              })}
        </div>

        {/* ===== Row 2: Charts ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          {/* Sales Trend - Area Chart */}
          <div
            className="lg:col-span-3 bg-white rounded-xl p-5 shadow-sm"
            style={{ borderRadius: '12px' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: '#1D2129' }}>
                销售趋势
              </h3>
              <span className="text-xs px-2 py-1 rounded" style={{ color: '#86909C', backgroundColor: '#F2F3F5' }}>
                近7个月
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2B5AED" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2B5AED" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F2F3F5" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#86909C', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#86909C', fontSize: 12 }}
                    tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E6EB',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), '销售额']}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#2B5AED"
                    strokeWidth={2}
                    fill="url(#salesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Status - Pie Chart */}
          <div
            className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm"
            style={{ borderRadius: '12px' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: '#1D2129' }}>
                订单状态分布
              </h3>
              <span className="text-xs px-2 py-1 rounded" style={{ color: '#86909C', backgroundColor: '#F2F3F5' }}>
                本月
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E6EB',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value) => [`${value}单`, '']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span style={{ color: '#4E5969', fontSize: 12 }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ===== Row 3: Quick Entry Grid ===== */}
        <div className="bg-white rounded-xl p-5 shadow-sm" style={{ borderRadius: '12px' }}>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={16} style={{ color: '#1D2129' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#1D2129' }}>
              快捷入口
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {quickEntries.map((entry) => {
              const Icon = entry.icon
              return (
                <button
                  key={entry.label}
                  onClick={() => navigate(entry.path)}
                  className="flex flex-col items-center gap-2.5 py-4 px-2 rounded-xl transition hover:shadow-md"
                  style={{ backgroundColor: '#FAFAFA' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = entry.bg
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FAFAFA'
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: entry.bg }}
                  >
                    <Icon size={20} style={{ color: entry.color }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#4E5969' }}>
                    {entry.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ===== Row 4: Additional Stats (secondary info) ===== */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {[
              { label: '客户数量', value: stats.totalCustomers, accent: '#2B5AED' },
              { label: '供应商数量', value: stats.totalSuppliers, accent: '#00B42A' },
              { label: '采购订单', value: stats.purchaseOrdersCount, accent: '#FF7D00' },
              { label: '员工总数', value: stats.totalEmployees, accent: '#7C3AED' },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-xl px-5 py-4 shadow-sm flex items-center gap-3"
                style={{ borderRadius: '12px' }}
              >
                <div
                  className="w-1 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: item.accent }}
                />
                <div>
                  <p className="text-xs" style={{ color: '#86909C' }}>
                    {item.label}
                  </p>
                  <p className="text-lg font-bold" style={{ color: '#1D2129' }}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
