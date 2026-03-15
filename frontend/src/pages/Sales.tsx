import { useState, useEffect } from 'react'
import { Plus, Trash2, Users, ShoppingCart, Search, Eye, ChevronDown } from 'lucide-react'
import type { Customer, SalesOrder, Product } from '../types'
import {
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  getSalesOrders, createSalesOrder, updateSalesOrderStatus, deleteSalesOrder,
  getProducts,
} from '../lib/db'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'

// ─── Local Types ───────────────────────────────────────────────

type Tab = 'orders' | 'customers'

type OrderStatus = SalesOrder['status']

interface LineItem {
  product_id: number
  quantity: number
  unit_price: number
  discount: number
  total: number
}

interface CustomerForm {
  code: string
  name: string
  email: string
  phone: string
  address: string
  credit_limit: number
}

interface OrderForm {
  customer_id: number
  order_date: string
  notes: string
}

const EMPTY_CUSTOMER_FORM: CustomerForm = {
  code: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  credit_limit: 0,
}

const EMPTY_ORDER_FORM: OrderForm = {
  customer_id: 0,
  order_date: new Date().toISOString().slice(0, 10),
  notes: '',
}

const EMPTY_LINE_ITEM: LineItem = {
  product_id: 0,
  quantity: 1,
  unit_price: 0,
  discount: 0,
  total: 0,
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'draft', label: '草稿' },
  { value: 'confirmed', label: '已确认' },
  { value: 'shipped', label: '已发货' },
  { value: 'delivered', label: '已送达' },
  { value: 'cancelled', label: '已取消' },
]

// ─── Helpers ───────────────────────────────────────────────────

function calcLineTotal(qty: number, price: number, discount: number): number {
  return qty * price * (1 - discount / 100)
}

function calcSubtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.total, 0)
}

function fmtMoney(n: number): string {
  return n.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })
}

// ─── Component ─────────────────────────────────────────────────

export default function Sales() {
  const [activeTab, setActiveTab] = useState<Tab>('orders')

  // Data
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Loading / error
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Customer tab state
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [customerForm, setCustomerForm] = useState<CustomerForm>(EMPTY_CUSTOMER_FORM)
  const [customerSaving, setCustomerSaving] = useState(false)

  // Order tab state
  const [orderCreateOpen, setOrderCreateOpen] = useState(false)
  const [orderViewOpen, setOrderViewOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<SalesOrder | null>(null)
  const [orderForm, setOrderForm] = useState<OrderForm>(EMPTY_ORDER_FORM)
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...EMPTY_LINE_ITEM }])
  const [orderSaving, setOrderSaving] = useState(false)

  // ── Data fetch ─────────────────────────────────────────────

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const [c, o, p] = await Promise.all([getCustomers(), getSalesOrders(), getProducts()])
      setCustomers(c)
      setOrders(o)
      setProducts(p)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  // ── Customer handlers ──────────────────────────────────────

  function openNewCustomer() {
    setEditingCustomer(null)
    setCustomerForm(EMPTY_CUSTOMER_FORM)
    setCustomerModalOpen(true)
  }

  function openEditCustomer(c: Customer) {
    setEditingCustomer(c)
    setCustomerForm({
      code: c.code,
      name: c.name,
      email: c.email ?? '',
      phone: c.phone ?? '',
      address: c.address ?? '',
      credit_limit: c.credit_limit,
    })
    setCustomerModalOpen(true)
  }

  async function handleCustomerSave() {
    if (!customerForm.code.trim() || !customerForm.name.trim()) return
    setCustomerSaving(true)
    try {
      const payload = {
        code: customerForm.code.trim(),
        name: customerForm.name.trim(),
        email: customerForm.email.trim() || undefined,
        phone: customerForm.phone.trim() || undefined,
        address: customerForm.address.trim() || undefined,
        credit_limit: Number(customerForm.credit_limit),
      }
      if (editingCustomer) {
        const updated = await updateCustomer(editingCustomer.id, payload)
        setCustomers(prev => prev.map(c => (c.id === updated.id ? updated : c)))
      } else {
        const created = await createCustomer(payload)
        setCustomers(prev => [...prev, created])
      }
      setCustomerModalOpen(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '保存失败')
    } finally {
      setCustomerSaving(false)
    }
  }

  async function handleDeleteCustomer(id: number) {
    if (!confirm('确认删除该客户？')) return
    try {
      await deleteCustomer(id)
      setCustomers(prev => prev.filter(c => c.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '删除失败')
    }
  }

  const filteredCustomers = customers.filter(c => {
    const q = customerSearch.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q)
    )
  })

  // ── Order handlers ─────────────────────────────────────────

  function openNewOrder() {
    setOrderForm({ ...EMPTY_ORDER_FORM, customer_id: customers[0]?.id ?? 0 })
    setLineItems([{ ...EMPTY_LINE_ITEM }])
    setOrderCreateOpen(true)
  }

  function openViewOrder(order: SalesOrder) {
    setViewingOrder(order)
    setOrderViewOpen(true)
  }

  function addLineItem() {
    setLineItems(prev => [...prev, { ...EMPTY_LINE_ITEM }])
  }

  function removeLineItem(index: number) {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateLineItem(index: number, field: keyof LineItem, raw: string | number) {
    setLineItems(prev => {
      const updated = prev.map((item, i) => {
        if (i !== index) return item
        const next = { ...item, [field]: typeof raw === 'string' ? Number(raw) : raw }
        // Auto-fill unit_price when product is selected
        if (field === 'product_id') {
          const p = products.find(p => p.id === Number(raw))
          if (p) next.unit_price = p.selling_price
        }
        next.total = calcLineTotal(next.quantity, next.unit_price, next.discount)
        return next
      })
      return updated
    })
  }

  const orderSubtotal = calcSubtotal(lineItems)
  const orderTotal = orderSubtotal

  async function handleOrderSave() {
    if (!orderForm.customer_id || lineItems.length === 0) return
    const validItems = lineItems.filter(i => i.product_id && i.quantity > 0)
    if (validItems.length === 0) return
    setOrderSaving(true)
    try {
      const orderPayload = {
        customer_id: orderForm.customer_id,
        order_date: orderForm.order_date,
        status: 'draft' as const,
        subtotal: orderSubtotal,
        discount: 0,
        tax: 0,
        total: orderTotal,
        notes: orderForm.notes.trim() || undefined,
      }
      const itemPayload = validItems.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount,
        total: i.total,
      }))
      await createSalesOrder(orderPayload, itemPayload)
      const refreshed = await getSalesOrders()
      setOrders(refreshed)
      setOrderCreateOpen(false)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '创建订单失败')
    } finally {
      setOrderSaving(false)
    }
  }

  async function handleStatusChange(orderId: number, status: OrderStatus) {
    try {
      await updateSalesOrderStatus(orderId, status)
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status } : o))
      )
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '状态更新失败')
    }
  }

  async function handleDeleteOrder(id: number) {
    if (!confirm('确认删除该订单？')) return
    try {
      await deleteSalesOrder(id)
      setOrders(prev => prev.filter(o => o.id !== id))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '删除失败')
    }
  }

  // ── Render ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#86909C]">
        加载中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-[#F53F3F]">
        {error}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1D2129]">销售管理</h1>
        <p className="text-sm text-[#86909C] mt-1">管理客户信息与销售订单</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E6EB]">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'border-[#2B5AED] text-[#2B5AED]'
                : 'border-transparent text-[#86909C] hover:text-[#4E5969] hover:border-[#E5E6EB]'
            }`}
          >
            <ShoppingCart size={16} />
            销售订单
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'customers'
                ? 'border-[#2B5AED] text-[#2B5AED]'
                : 'border-transparent text-[#86909C] hover:text-[#4E5969] hover:border-[#E5E6EB]'
            }`}
          >
            <Users size={16} />
            客户管理
          </button>
        </nav>
      </div>

      {/* ── Sales Orders Tab ── */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-[#86909C]">共 {orders.length} 条订单</p>
            <button
              onClick={openNewOrder}
              className="flex items-center gap-2 bg-[#2B5AED] hover:bg-[#1F4BD8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              新建订单
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E5E6EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E6EB]">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    {['订单号', '客户', '日期', '状态', '合计', '操作'].map(h => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium text-[#86909C] uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#F2F3F5]">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[#C9CDD4] text-sm">
                        暂无销售订单
                      </td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} className="hover:bg-[#F7F8FA] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1D2129]">
                          {order.order_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4E5969]">
                          {order.customer?.name ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4E5969]">
                          {order.order_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Badge status={order.status} />
                            <div className="relative">
                              <select
                                value={order.status}
                                onChange={e =>
                                  handleStatusChange(order.id, e.target.value as OrderStatus)
                                }
                                className="appearance-none bg-transparent text-xs text-[#C9CDD4] border border-[#E5E6EB] rounded px-2 py-0.5 pr-5 cursor-pointer hover:border-[#86909C] focus:outline-none focus:ring-1 focus:ring-[#2B5AED]"
                              >
                                {STATUS_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={10}
                                className="absolute right-1 top-1/2 -translate-y-1/2 text-[#C9CDD4] pointer-events-none"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1D2129]">
                          {fmtMoney(order.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openViewOrder(order)}
                              className="text-[#2B5AED] hover:bg-[#EDF1FE] rounded transition-colors p-1"
                              title="查看详情"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-[#F53F3F] hover:bg-[#FEECEC] rounded transition-colors p-1"
                              title="删除订单"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Customers Tab ── */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9CDD4]"
              />
              <input
                type="text"
                placeholder="搜索客户..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#E5E6EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-transparent"
              />
            </div>
            <button
              onClick={openNewCustomer}
              className="flex items-center gap-2 bg-[#2B5AED] hover:bg-[#1F4BD8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              新增客户
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E5E6EB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E6EB]">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    {['编码', '名称', '邮箱', '电话', '信用额度', '操作'].map(h => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium text-[#86909C] uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5E6EB]">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[#C9CDD4] text-sm">
                        {customerSearch ? '未找到匹配的客户' : '暂无客户数据'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(c => (
                      <tr key={c.id} className="hover:bg-[#F7F8FA] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1D2129]">
                          {c.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1D2129]">
                          {c.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4E5969]">
                          {c.email ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4E5969]">
                          {c.phone ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1D2129]">
                          {fmtMoney(c.credit_limit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openEditCustomer(c)}
                              className="text-[#2B5AED] hover:bg-[#EDF1FE] rounded text-xs font-medium transition-colors px-1 py-0.5"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(c.id)}
                              className="text-[#F53F3F] hover:bg-[#FEECEC] rounded transition-colors p-1"
                              title="删除客户"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Customer Modal ── */}
      <Modal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title={editingCustomer ? '编辑客户' : '新增客户'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">
                编码 <span className="text-[#F53F3F]">*</span>
              </label>
              <input
                type="text"
                value={customerForm.code}
                onChange={e => setCustomerForm(f => ({ ...f, code: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-transparent"
                placeholder="客户编码"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">
                名称 <span className="text-[#F53F3F]">*</span>
              </label>
              <input
                type="text"
                value={customerForm.name}
                onChange={e => setCustomerForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-transparent"
                placeholder="客户名称"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">邮箱</label>
              <input
                type="email"
                value={customerForm.email}
                onChange={e => setCustomerForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">电话</label>
              <input
                type="tel"
                value={customerForm.phone}
                onChange={e => setCustomerForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-transparent"
                placeholder="联系电话"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4E5969] mb-1">地址</label>
            <input
              type="text"
              value={customerForm.address}
              onChange={e => setCustomerForm(f => ({ ...f, address: e.target.value }))}
              className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-transparent"
              placeholder="客户地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4E5969] mb-1">信用额度</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={customerForm.credit_limit}
              onChange={e => setCustomerForm(f => ({ ...f, credit_limit: Number(e.target.value) }))}
              className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setCustomerModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#4E5969] bg-white border border-[#E5E6EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCustomerSave}
              disabled={customerSaving || !customerForm.code.trim() || !customerForm.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#2B5AED] rounded-lg hover:bg-[#1F4BD8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {customerSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Create Order Modal ── */}
      <Modal
        open={orderCreateOpen}
        onClose={() => setOrderCreateOpen(false)}
        title="新建销售订单"
        size="xl"
      >
        <div className="space-y-5">
          {/* Order header fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">
                客户 <span className="text-[#F53F3F]">*</span>
              </label>
              <select
                value={orderForm.customer_id}
                onChange={e => setOrderForm(f => ({ ...f, customer_id: Number(e.target.value) }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-transparent"
              >
                <option value={0} disabled>请选择客户</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4E5969] mb-1">
                订单日期 <span className="text-[#F53F3F]">*</span>
              </label>
              <input
                type="date"
                value={orderForm.order_date}
                onChange={e => setOrderForm(f => ({ ...f, order_date: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4E5969] mb-1">备注</label>
            <textarea
              value={orderForm.notes}
              onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B5AED] focus:border-transparent resize-none"
              placeholder="订单备注（可选）"
            />
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[#4E5969]">商品明细</h4>
              <button
                onClick={addLineItem}
                className="flex items-center gap-1 text-[#2B5AED] hover:text-[#1F4BD8] text-sm font-medium transition-colors"
              >
                <Plus size={14} />
                添加商品
              </button>
            </div>

            <div className="border border-[#E5E6EB] rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-[#E5E6EB]">
                <thead className="bg-[#F7F8FA]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#86909C] w-[30%]">商品</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#86909C] w-[15%]">数量</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#86909C] w-[20%]">单价</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#86909C] w-[15%]">折扣%</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#86909C] w-[15%]">小计</th>
                    <th className="px-3 py-2 w-[5%]"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5E6EB]">
                  {lineItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <select
                          value={item.product_id}
                          onChange={e => updateLineItem(index, 'product_id', e.target.value)}
                          className="w-full border border-[#E5E6EB] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2B5AED]"
                        >
                          <option value={0} disabled>选择商品</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.code} - {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateLineItem(index, 'quantity', e.target.value)}
                          className="w-full border border-[#E5E6EB] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2B5AED]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={e => updateLineItem(index, 'unit_price', e.target.value)}
                          className="w-full border border-[#E5E6EB] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2B5AED]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={item.discount}
                          onChange={e => updateLineItem(index, 'discount', e.target.value)}
                          className="w-full border border-[#E5E6EB] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#2B5AED]"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-medium text-[#1D2129]">
                        {fmtMoney(item.total)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => removeLineItem(index)}
                          disabled={lineItems.length === 1}
                          className="text-[#F53F3F] hover:bg-[#FEECEC] rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-0.5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-3 flex justify-end">
              <div className="w-56 space-y-1.5 text-sm">
                <div className="flex justify-between text-[#4E5969]">
                  <span>小计</span>
                  <span>{fmtMoney(orderSubtotal)}</span>
                </div>
                <div className="flex justify-between font-semibold text-[#1D2129] border-t border-[#E5E6EB] pt-1.5">
                  <span>合计</span>
                  <span>{fmtMoney(orderTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setOrderCreateOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[#4E5969] bg-white border border-[#E5E6EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleOrderSave}
              disabled={
                orderSaving ||
                !orderForm.customer_id ||
                lineItems.every(i => !i.product_id || i.quantity <= 0)
              }
              className="px-4 py-2 text-sm font-medium text-white bg-[#2B5AED] rounded-lg hover:bg-[#1F4BD8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {orderSaving ? '创建中...' : '创建订单'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── View Order Modal ── */}
      <Modal
        open={orderViewOpen}
        onClose={() => setOrderViewOpen(false)}
        title={`订单详情 — ${viewingOrder?.order_number ?? ''}`}
        size="lg"
      >
        {viewingOrder && (
          <div className="space-y-5">
            {/* Order meta */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#86909C]">订单号</span>
                <span className="font-medium text-[#1D2129]">{viewingOrder.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86909C]">状态</span>
                <Badge status={viewingOrder.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-[#86909C]">客户</span>
                <span className="font-medium text-[#1D2129]">
                  {viewingOrder.customer?.name ?? '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86909C]">日期</span>
                <span className="text-[#1D2129]">{viewingOrder.order_date}</span>
              </div>
              {viewingOrder.notes && (
                <div className="col-span-2 flex justify-between">
                  <span className="text-[#86909C]">备注</span>
                  <span className="text-[#1D2129] text-right max-w-xs">{viewingOrder.notes}</span>
                </div>
              )}
            </div>

            {/* Items */}
            {viewingOrder.items && viewingOrder.items.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[#4E5969] mb-2">商品明细</h4>
                <div className="border border-[#E5E6EB] rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-[#E5E6EB]">
                    <thead className="bg-[#F7F8FA]">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[#86909C]">商品</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[#86909C]">数量</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[#86909C]">单价</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[#86909C]">折扣</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-[#86909C]">小计</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#E5E6EB]">
                      {viewingOrder.items.map((item, i) => (
                        <tr key={item.id ?? i}>
                          <td className="px-4 py-2 text-sm text-[#1D2129]">
                            {item.product?.name ?? `商品 #${item.product_id}`}
                          </td>
                          <td className="px-4 py-2 text-sm text-[#4E5969] text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-[#4E5969] text-right">
                            {fmtMoney(item.unit_price)}
                          </td>
                          <td className="px-4 py-2 text-sm text-[#4E5969] text-right">
                            {item.discount > 0 ? `${item.discount}%` : '-'}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-[#1D2129] text-right">
                            {fmtMoney(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Order totals */}
            <div className="flex justify-end">
              <div className="w-56 space-y-1.5 text-sm">
                <div className="flex justify-between text-[#4E5969]">
                  <span>小计</span>
                  <span>{fmtMoney(viewingOrder.subtotal)}</span>
                </div>
                {viewingOrder.discount > 0 && (
                  <div className="flex justify-between text-[#4E5969]">
                    <span>折扣</span>
                    <span>-{fmtMoney(viewingOrder.discount)}</span>
                  </div>
                )}
                {viewingOrder.tax > 0 && (
                  <div className="flex justify-between text-[#4E5969]">
                    <span>税费</span>
                    <span>{fmtMoney(viewingOrder.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-[#1D2129] border-t border-[#E5E6EB] pt-1.5">
                  <span>合计</span>
                  <span>{fmtMoney(viewingOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setOrderViewOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[#4E5969] bg-white border border-[#E5E6EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
