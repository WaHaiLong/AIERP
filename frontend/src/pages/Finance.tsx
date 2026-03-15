import { useState, useEffect } from 'react'
import { Plus, Trash2, CreditCard, Search, DollarSign } from 'lucide-react'
import type { Invoice, Payment } from '../types'
import {
  getInvoices, createInvoice, deleteInvoice, createPayment,
} from '../lib/db'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'

const formatCurrency = (n: number) =>
  `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const today = () => new Date().toISOString().slice(0, 10)

// ─── Invoice form ─────────────────────────────────────────────
interface InvoiceForm {
  party_name: string
  invoice_date: string
  due_date: string
  amount: number
  notes: string
}

const emptyInvoiceForm = (): InvoiceForm => ({
  party_name: '',
  invoice_date: today(),
  due_date: '',
  amount: 0,
  notes: '',
})

// ─── Payment form ─────────────────────────────────────────────
interface PaymentForm {
  payment_date: string
  amount: number
  method: Payment['method']
  reference: string
  notes: string
}

const emptyPaymentForm = (remaining = 0): PaymentForm => ({
  payment_date: today(),
  amount: remaining,
  method: 'bank_transfer',
  reference: '',
  notes: '',
})

type TabType = 'receivable' | 'payable'

export default function Finance() {
  const [tab, setTab] = useState<TabType>('receivable')

  // ── Data ──────────────────────────────────────────────────────
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Invoice modal ─────────────────────────────────────────────
  const [invoiceModal, setInvoiceModal] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(emptyInvoiceForm())

  // ── Payment modal ─────────────────────────────────────────────
  const [paymentModal, setPaymentModal] = useState(false)
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null)
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(emptyPaymentForm())

  // ── Search ────────────────────────────────────────────────────
  const [search, setSearch] = useState('')

  // ── Saving ────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)

  // ─── Load data ─────────────────────────────────────────────────
  const loadInvoices = async () => {
    setLoading(true)
    try {
      const data = await getInvoices()
      setInvoices(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadInvoices() }, [])

  // ─── Derived data ──────────────────────────────────────────────
  const tabInvoices = invoices.filter(inv => inv.invoice_type === tab)

  const filtered = tabInvoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    inv.party_name.toLowerCase().includes(search.toLowerCase())
  )

  const totalAmount = tabInvoices.reduce((s, inv) => s + inv.amount, 0)
  const totalPaid = tabInvoices.reduce((s, inv) => s + inv.paid_amount, 0)
  const totalPending = totalAmount - totalPaid

  // ─── Invoice CRUD ──────────────────────────────────────────────
  const openNewInvoice = () => {
    setInvoiceForm(emptyInvoiceForm())
    setError(null)
    setInvoiceModal(true)
  }

  const handleSaveInvoice = async () => {
    if (!invoiceForm.party_name.trim()) { setError('往来方名称为必填项'); return }
    if (invoiceForm.amount <= 0) { setError('金额必须大于 0'); return }
    setSaving(true)
    setError(null)
    try {
      await createInvoice({
        invoice_type: tab,
        party_name: invoiceForm.party_name,
        invoice_date: invoiceForm.invoice_date,
        due_date: invoiceForm.due_date || undefined,
        amount: invoiceForm.amount,
        notes: invoiceForm.notes || undefined,
      })
      setInvoiceModal(false)
      await loadInvoices()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteInvoice = async (id: number) => {
    if (!confirm('确定删除此账单？')) return
    try {
      await deleteInvoice(id)
      await loadInvoices()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '删除失败')
    }
  }

  // ─── Payment ───────────────────────────────────────────────────
  const openPayment = (inv: Invoice) => {
    setPayingInvoice(inv)
    setPaymentForm(emptyPaymentForm(inv.amount - inv.paid_amount))
    setError(null)
    setPaymentModal(true)
  }

  const handleSavePayment = async () => {
    if (!payingInvoice) return
    if (paymentForm.amount <= 0) { setError('付款金额必须大于 0'); return }
    setSaving(true)
    setError(null)
    try {
      await createPayment({
        invoice_id: payingInvoice.id,
        payment_date: paymentForm.payment_date,
        amount: paymentForm.amount,
        method: paymentForm.method,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
      })
      setPaymentModal(false)
      setPayingInvoice(null)
      await loadInvoices()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '付款登记失败')
    } finally {
      setSaving(false)
    }
  }

  const isReceivable = tab === 'receivable'
  const tabLabel = isReceivable ? '应收账款' : '应付账款'
  const collectedLabel = isReceivable ? '已收' : '已付'
  const pendingLabel = isReceivable ? '待收' : '待付'
  const payButtonLabel = isReceivable ? '登记收款' : '登记付款'
  const payModalTitle = isReceivable ? '登记收款' : '登记付款'

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#E8F7EB] flex items-center justify-center">
          <CreditCard className="text-[#00B42A]" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1D2129]">财务管理</h1>
          <p className="text-sm text-[#86909C]">管理应收账款与应付账款</p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-[#FEECEC] border border-[#FEECEC] text-[#F53F3F] px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[#C9CDD4] hover:text-[#F53F3F] ml-4">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#E5E6EB]">
        <nav className="flex gap-6">
          {(['receivable', 'payable'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch('') }}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-[#2B5AED] text-[#2B5AED]'
                  : 'border-transparent text-[#86909C] hover:text-[#4E5969]'
              }`}
            >
              {t === 'receivable' ? '应收账款' : '应付账款'}
            </button>
          ))}
        </nav>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E6EB] shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#EDF1FE] flex items-center justify-center shrink-0">
            <DollarSign className="text-[#2B5AED]" size={18} />
          </div>
          <div>
            <p className="text-xs text-[#86909C] font-medium">总金额</p>
            <p className="text-lg font-bold text-[#1D2129] mt-0.5">{formatCurrency(totalAmount)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E6EB] shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#E8F7EB] flex items-center justify-center shrink-0">
            <CreditCard className="text-[#00B42A]" size={18} />
          </div>
          <div>
            <p className="text-xs text-[#86909C] font-medium">{collectedLabel}</p>
            <p className="text-lg font-bold text-[#00B42A] mt-0.5">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E6EB] shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#FFF3E0] flex items-center justify-center shrink-0">
            <DollarSign className="text-[#FF7D00]" size={18} />
          </div>
          <div>
            <p className="text-xs text-[#86909C] font-medium">{pendingLabel}</p>
            <p className="text-lg font-bold text-[#FF7D00] mt-0.5">{formatCurrency(totalPending)}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9CDD4]" size={16} />
          <input
            type="text"
            placeholder={`搜索${tabLabel}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E6EB] rounded-lg focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED] outline-none"
          />
        </div>
        <button
          onClick={openNewInvoice}
          className="flex items-center gap-2 bg-[#2B5AED] hover:bg-[#1F4BD8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          新建账单
        </button>
      </div>

      {/* Invoice table */}
      <div className="bg-white rounded-xl border border-[#E5E6EB] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#C9CDD4] text-sm">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[#C9CDD4] text-sm">暂无{tabLabel}数据</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F7F8FA] border-b border-[#E5E6EB]">
              <tr>
                {['单据号', '往来方', '单据日期', '到期日', '金额', '已付金额', '状态', '操作'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#86909C] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F3F5]">
              {filtered.map(inv => {
                const remaining = inv.amount - inv.paid_amount
                const canPay = inv.status !== 'paid'
                return (
                  <tr key={inv.id} className="hover:bg-[#F7F8FA] transition-colors">
                    <td className="px-4 py-3 font-mono text-[#4E5969]">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-medium text-[#1D2129]">{inv.party_name}</td>
                    <td className="px-4 py-3 text-[#86909C]">{inv.invoice_date}</td>
                    <td className="px-4 py-3 text-[#86909C]">{inv.due_date ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-[#1D2129]">{formatCurrency(inv.amount)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-[#1D2129]">{formatCurrency(inv.paid_amount)}</span>
                        {remaining > 0 && (
                          <span className="block text-xs text-[#FF7D00] mt-0.5">余 {formatCurrency(remaining)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={inv.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {canPay && (
                          <button
                            onClick={() => openPayment(inv)}
                            className="flex items-center gap-1 text-xs text-[#2B5AED] border border-[#C9CDD4] hover:bg-[#EDF1FE] px-2 py-1 rounded transition-colors font-medium"
                          >
                            <CreditCard size={11} />
                            {payButtonLabel}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="text-[#F53F3F] hover:text-[#F53F3F] p-1 rounded hover:bg-[#FEECEC] transition-colors"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── New Invoice Modal ────────────────────────────────── */}
      <Modal
        open={invoiceModal}
        onClose={() => { setInvoiceModal(false); setError(null) }}
        title={`新建${tabLabel}账单`}
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-[#FEECEC] border border-[#FEECEC] text-[#F53F3F] text-sm px-3 py-2 rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-[#4E5969] mb-1">
              往来方 <span className="text-[#F53F3F]">*</span>
            </label>
            <input
              type="text"
              value={invoiceForm.party_name}
              onChange={e => setInvoiceForm(f => ({ ...f, party_name: e.target.value }))}
              className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED] outline-none"
              placeholder={isReceivable ? '客户名称' : '供应商名称'}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4E5969] mb-1">单据日期</label>
              <input
                type="date"
                value={invoiceForm.invoice_date}
                onChange={e => setInvoiceForm(f => ({ ...f, invoice_date: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4E5969] mb-1">到期日</label>
              <input
                type="date"
                value={invoiceForm.due_date}
                onChange={e => setInvoiceForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED] outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4E5969] mb-1">
              金额 <span className="text-[#F53F3F]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9CDD4] text-sm">¥</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={invoiceForm.amount === 0 ? '' : invoiceForm.amount}
                onChange={e => setInvoiceForm(f => ({ ...f, amount: Number(e.target.value) }))}
                className="w-full border border-[#E5E6EB] rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED] outline-none"
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4E5969] mb-1">备注</label>
            <textarea
              rows={2}
              value={invoiceForm.notes}
              onChange={e => setInvoiceForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED] outline-none resize-none"
              placeholder="选填备注..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setInvoiceModal(false); setError(null) }}
              className="px-4 py-2 text-sm text-[#4E5969] border border-[#E5E6EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSaveInvoice}
              disabled={saving}
              className="px-4 py-2 text-sm text-white bg-[#2B5AED] hover:bg-[#1F4BD8] disabled:opacity-50 rounded-lg transition-colors"
            >
              {saving ? '保存中...' : '创建账单'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Payment Modal ────────────────────────────────────── */}
      <Modal
        open={paymentModal}
        onClose={() => { setPaymentModal(false); setPayingInvoice(null); setError(null) }}
        title={payingInvoice ? `${payModalTitle} — ${payingInvoice.invoice_number}` : payModalTitle}
        size="sm"
      >
        {payingInvoice && (
          <div className="space-y-4">
            {/* Invoice summary */}
            <div className="bg-[#F7F8FA] rounded-lg px-4 py-3 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#86909C]">往来方</span>
                <span className="font-medium text-[#1D2129]">{payingInvoice.party_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86909C]">账单金额</span>
                <span className="font-medium text-[#1D2129]">{formatCurrency(payingInvoice.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86909C]">{pendingLabel}金额</span>
                <span className="font-semibold text-[#FF7D00]">
                  {formatCurrency(payingInvoice.amount - payingInvoice.paid_amount)}
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-[#FEECEC] border border-[#FEECEC] text-[#F53F3F] text-sm px-3 py-2 rounded-lg">{error}</div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#4E5969] mb-1">付款日期</label>
              <input
                type="date"
                value={paymentForm.payment_date}
                onChange={e => setPaymentForm(f => ({ ...f, payment_date: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4E5969] mb-1">
                付款金额 <span className="text-[#F53F3F]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C9CDD4] text-sm">¥</span>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={paymentForm.amount === 0 ? '' : paymentForm.amount}
                  onChange={e => setPaymentForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  className="w-full border border-[#E5E6EB] rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED] outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4E5969] mb-1">付款方式</label>
              <select
                value={paymentForm.method}
                onChange={e => setPaymentForm(f => ({ ...f, method: e.target.value as Payment['method'] }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED] outline-none bg-white"
              >
                <option value="cash">现金</option>
                <option value="bank_transfer">银行转账</option>
                <option value="check">支票</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4E5969] mb-1">参考号</label>
              <input
                type="text"
                value={paymentForm.reference}
                onChange={e => setPaymentForm(f => ({ ...f, reference: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED] outline-none"
                placeholder="转账流水号等（选填）"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#4E5969] mb-1">备注</label>
              <textarea
                rows={2}
                value={paymentForm.notes}
                onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border border-[#E5E6EB] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2B5AED] focus:border-[#2B5AED] outline-none resize-none"
                placeholder="选填备注..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setPaymentModal(false); setPayingInvoice(null); setError(null) }}
                className="px-4 py-2 text-sm text-[#4E5969] border border-[#E5E6EB] rounded-lg hover:bg-[#F7F8FA] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSavePayment}
                disabled={saving}
                className="px-4 py-2 text-sm text-white bg-[#2B5AED] hover:bg-[#1F4BD8] disabled:opacity-50 rounded-lg transition-colors"
              >
                {saving ? '保存中...' : '确认登记'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
