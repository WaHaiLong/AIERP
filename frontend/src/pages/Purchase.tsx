import { useState, useEffect } from 'react'
import { Plus, Trash2, Truck, Search, Eye } from 'lucide-react'
import type { Supplier, PurchaseOrder, Product } from '../types'
import {
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getPurchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder,
  getProducts,
} from '../lib/db'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'

const formatCurrency = (n: number) =>
  `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const today = () => new Date().toISOString().slice(0, 10)

// ─── Supplier form state ───────────────────────────────────────
interface SupplierForm {
  code: string
  name: string
  email: string
  phone: string
  address: string
  payment_terms: number
}

const emptySupplierForm = (): SupplierForm => ({
  code: '', name: '', email: '', phone: '', address: '', payment_terms: 30,
})

// ─── Purchase order item state ─────────────────────────────────
interface OrderItemDraft {
  product_id: number
  quantity: number
  unit_price: number
}

interface OrderForm {
  supplier_id: number
  order_date: string
  expected_date: string
  notes: string
  items: OrderItemDraft[]
}

const emptyOrderForm = (): OrderForm => ({
  supplier_id: 0,
  order_date: today(),
  expected_date: '',
  notes: '',
  items: [],
})

export default function Purchase() {
  const [tab, setTab] = useState<'orders' | 'suppliers'>('orders')

  // ── Data ──────────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // ── Supplier modal ────────────────────────────────────────────
  const [supplierModal, setSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierForm, setSupplierForm] = useState<SupplierForm>(emptySupplierForm())
  const [supplierSearch, setSupplierSearch] = useState('')

  // ── Order modal ───────────────────────────────────────────────
  const [orderModal, setOrderModal] = useState(false)
  const [orderForm, setOrderForm] = useState<OrderForm>(emptyOrderForm())
  const [orderSearch, setOrderSearch] = useState('')

  // ── View order modal ──────────────────────────────────────────
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null)

  // ── Saving flags ──────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ─── Load data ─────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, o, p] = await Promise.all([getSuppliers(), getPurchaseOrders(), getProducts()])
      setSuppliers(s)
      setOrders(o)
      setProducts(p)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // ─── Supplier CRUD ─────────────────────────────────────────────
  const openNewSupplier = () => {
    setEditingSupplier(null)
    setSupplierForm(emptySupplierForm())
    setSupplierModal(true)
  }

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s)
    setSupplierForm({
      code: s.code,
      name: s.name,
      email: s.email ?? '',
      phone: s.phone ?? '',
      address: s.address ?? '',
      payment_terms: s.payment_terms,
    })
    setSupplierModal(true)
  }

  const handleSaveSupplier = async () => {
    if (!supplierForm.code.trim() || !supplierForm.name.trim()) {
      setError('编码和名称为必填项')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, supplierForm)
      } else {
        await createSupplier(supplierForm)
      }
      setSupplierModal(false)
      await loadAll()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('确定删除此供应商？')) return
    try {
      await deleteSupplier(id)
      await loadAll()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(supplierSearch.toLowerCase())
  )

  // ─── Order CRUD ────────────────────────────────────────────────
  const openNewOrder = () => {
    setOrderForm(emptyOrderForm())
    setOrderModal(true)
  }

  const addOrderItem = () => {
    setOrderForm(f => ({
      ...f,
      items: [...f.items, { product_id: products[0]?.id ?? 0, quantity: 1, unit_price: 0 }],
    }))
  }

  const removeOrderItem = (idx: number) => {
    setOrderForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }

  const updateOrderItem = (idx: number, field: keyof OrderItemDraft, value: number) => {
    setOrderForm(f => {
      const items = f.items.map((item, i) => {
        if (i !== idx) return item
        const updated = { ...item, [field]: value }
        if (field === 'product_id') {
          const prod = products.find(p => p.id === value)
          updated.unit_price = prod?.cost_price ?? 0
        }
        return updated
      })
      return { ...f, items }
    })
  }

  const orderSubtotal = orderForm.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price, 0
  )
  const orderTotal = orderSubtotal

  const handleSaveOrder = async () => {
    if (!orderForm.supplier_id) { setError('请选择供应商'); return }
    if (orderForm.items.length === 0) { setError('请至少添加一个商品'); return }
    setSaving(true)
    setError(null)
    try {
      const orderPayload = {
        supplier_id: orderForm.supplier_id,
        order_date: orderForm.order_date,
        expected_date: orderForm.expected_date || undefined,
        status: 'draft' as const,
        subtotal: orderSubtotal,
        tax: 0,
        total: orderTotal,
        notes: orderForm.notes || undefined,
      }
      const itemsPayload = orderForm.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }))
      await createPurchaseOrder(orderPayload, itemsPayload)
      setOrderModal(false)
      await loadAll()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('确定删除此采购订单？')) return
    try {
      await deletePurchaseOrder(id)
      await loadAll()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  const handleStatusChange = async (id: number, status: PurchaseOrder['status']) => {
    try {
      await updatePurchaseOrderStatus(id, status)
      await loadAll()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '状态更新失败')
    }
  }

  const filteredOrders = orders.filter(o =>
    o.order_number.toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.supplier?.name ?? '').toLowerCase().includes(orderSearch.toLowerCase())
  )

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <Truck className="text-orange-600" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">采购管理</h1>
          <p className="text-sm text-gray-500">管理采购订单与供应商信息</p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(['orders', 'suppliers'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'orders' ? '采购订单' : '供应商管理'}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Suppliers Tab ────────────────────────────────────── */}
      {tab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="搜索供应商..."
                value={supplierSearch}
                onChange={e => setSupplierSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
            <button
              onClick={openNewSupplier}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              新建供应商
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">加载中...</div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">暂无供应商数据</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['编码', '名称', '邮箱', '电话', '账期（天）', '操作'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSuppliers.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-600">{s.code}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-3 text-gray-500">{s.email ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{s.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{s.payment_terms}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditSupplier(s)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(s.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Orders Tab ───────────────────────────────────────── */}
      {tab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="搜索订单号或供应商..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
            <button
              onClick={openNewOrder}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              新建采购订单
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">加载中...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">暂无采购订单数据</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['订单号', '供应商', '订单日期', '预期到货', '状态', '合计', '操作'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-700">{o.order_number}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{o.supplier?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{o.order_date}</td>
                      <td className="px-4 py-3 text-gray-500">{o.expected_date ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge status={o.status} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(o.total)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewOrder(o)}
                            className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
                            title="查看详情"
                          >
                            <Eye size={14} />
                          </button>
                          <select
                            value={o.status}
                            onChange={e => handleStatusChange(o.id, e.target.value as PurchaseOrder['status'])}
                            className="text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-600 focus:ring-1 focus:ring-orange-400 outline-none bg-white"
                          >
                            <option value="draft">草稿</option>
                            <option value="sent">已发送</option>
                            <option value="received">已收货</option>
                            <option value="cancelled">已取消</option>
                          </select>
                          <button
                            onClick={() => handleDeleteOrder(o.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Supplier Modal ───────────────────────────────────── */}
      <Modal
        open={supplierModal}
        onClose={() => { setSupplierModal(false); setError(null) }}
        title={editingSupplier ? '编辑供应商' : '新建供应商'}
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">编码 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={supplierForm.code}
                onChange={e => setSupplierForm(f => ({ ...f, code: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="SUP-001"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">名称 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={supplierForm.name}
                onChange={e => setSupplierForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="供应商名称"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">邮箱</label>
              <input
                type="email"
                value={supplierForm.email}
                onChange={e => setSupplierForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">电话</label>
              <input
                type="text"
                value={supplierForm.phone}
                onChange={e => setSupplierForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="联系电话"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">地址</label>
            <input
              type="text"
              value={supplierForm.address}
              onChange={e => setSupplierForm(f => ({ ...f, address: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="供应商地址"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">账期（天）</label>
            <input
              type="number"
              min={0}
              value={supplierForm.payment_terms}
              onChange={e => setSupplierForm(f => ({ ...f, payment_terms: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setSupplierModal(false); setError(null) }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveSupplier}
              disabled={saving}
              className="px-4 py-2 text-sm text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Create Order Modal ───────────────────────────────── */}
      <Modal
        open={orderModal}
        onClose={() => { setOrderModal(false); setError(null) }}
        title="新建采购订单"
        size="xl"
      >
        <div className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">供应商 <span className="text-red-500">*</span></label>
              <select
                value={orderForm.supplier_id}
                onChange={e => setOrderForm(f => ({ ...f, supplier_id: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
              >
                <option value={0}>-- 选择供应商 --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">订单日期</label>
              <input
                type="date"
                value={orderForm.order_date}
                onChange={e => setOrderForm(f => ({ ...f, order_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">预期到货日期</label>
              <input
                type="date"
                value={orderForm.expected_date}
                onChange={e => setOrderForm(f => ({ ...f, expected_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">备注</label>
              <input
                type="text"
                value={orderForm.notes}
                onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="选填备注"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800">商品明细</h4>
              <button
                onClick={addOrderItem}
                className="flex items-center gap-1.5 text-xs text-orange-600 border border-orange-300 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={13} />
                添加商品
              </button>
            </div>

            {orderForm.items.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-400">
                点击「添加商品」按钮添加采购商品
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">商品</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 w-24">数量</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 w-28">单价</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 w-28">小计</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orderForm.items.map((item, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="px-3 py-2">
                          <select
                            value={item.product_id}
                            onChange={e => updateOrderItem(idx, 'product_id', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-400 outline-none bg-white"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => updateOrderItem(idx, 'quantity', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-400 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unit_price}
                            onChange={e => updateOrderItem(idx, 'unit_price', Number(e.target.value))}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-orange-400 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-gray-700 font-medium">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeOrderItem(idx)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totals */}
          {orderForm.items.length > 0 && (
            <div className="flex justify-end">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-w-[200px] space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>小计</span>
                  <span>{formatCurrency(orderSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-2">
                  <span>合计</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setOrderModal(false); setError(null) }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveOrder}
              disabled={saving}
              className="px-4 py-2 text-sm text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {saving ? '保存中...' : '创建订单'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── View Order Modal ─────────────────────────────────── */}
      <Modal
        open={!!viewOrder}
        onClose={() => setViewOrder(null)}
        title={`采购订单详情 — ${viewOrder?.order_number ?? ''}`}
        size="lg"
      >
        {viewOrder && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs">供应商</span>
                <p className="font-medium text-gray-900 mt-0.5">{viewOrder.supplier?.name ?? '—'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">状态</span>
                <p className="mt-0.5"><Badge status={viewOrder.status} /></p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">订单日期</span>
                <p className="font-medium text-gray-900 mt-0.5">{viewOrder.order_date}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">预期到货</span>
                <p className="font-medium text-gray-900 mt-0.5">{viewOrder.expected_date ?? '—'}</p>
              </div>
              {viewOrder.notes && (
                <div className="col-span-2">
                  <span className="text-gray-500 text-xs">备注</span>
                  <p className="font-medium text-gray-900 mt-0.5">{viewOrder.notes}</p>
                </div>
              )}
            </div>

            {viewOrder.items && viewOrder.items.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">商品明细</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">商品</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">数量</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">单价</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">小计</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewOrder.items.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-900">{item.product?.name ?? `商品#${item.product_id}`}</td>
                          <td className="px-4 py-2 text-right text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-2 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-w-[200px] space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>小计</span>
                  <span>{formatCurrency(viewOrder.subtotal)}</span>
                </div>
                {viewOrder.tax > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>税费</span>
                    <span>{formatCurrency(viewOrder.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-2">
                  <span>合计</span>
                  <span>{formatCurrency(viewOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewOrder(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
