import { useState, useEffect } from 'react'
import { Plus, Trash2, CreditCard, DollarSign } from 'lucide-react'
import type { Invoice } from '../types'
import { getInvoices, createInvoice, deleteInvoice, createPayment } from '../lib/db'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'

export default function Finance() {
  const [tab, setTab] = useState<'receivable' | 'payable'>('receivable')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [invModal, setInvModal] = useState(false)
  const [payModal, setPayModal] = useState(false)
  const [selectedInv, setSelectedInv] = useState<Invoice | null>(null)
  const [saving, setSaving] = useState(false)

  const emptyInv = { party_name: '', invoice_date: new Date().toISOString().slice(0, 10), due_date: '', amount: 0, notes: '' }
  const [invForm, setInvForm] = useState(emptyInv)
  const [payForm, setPayForm] = useState({ payment_date: new Date().toISOString().slice(0, 10), amount: 0, method: 'bank_transfer', reference: '', notes: '' })

  const load = async () => {
    setLoading(true)
    try {
      setInvoices(await getInvoices(tab))
    } catch (e: any) { alert('加载失败: ' + e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [tab])

  const totalAmount = invoices.reduce((s, i) => s + i.amount, 0)
  const paidAmount = invoices.reduce((s, i) => s + i.paid_amount, 0)
  const unpaidAmount = totalAmount - paidAmount

  const handleCreateInv = async () => {
    setSaving(true)
    try {
      await createInvoice({ ...invForm, invoice_type: tab, due_date: invForm.due_date || undefined, amount: Number(invForm.amount) } as any)
      setInvModal(false); setInvForm(emptyInv); load()
    } catch (e: any) { alert('创建失败: ' + e.message) } finally { setSaving(false) }
  }

  const handlePay = async () => {
    if (!selectedInv) return
    setSaving(true)
    try {
      await createPayment({ invoice_id: selectedInv.id, ...payForm, amount: Number(payForm.amount) } as any)
      setPayModal(false); load()
    } catch (e: any) { alert('登记失败: ' + e.message) } finally { setSaving(false) }
  }

  const isReceivable = tab === 'receivable'
  const label = isReceivable ? { type: '应收账款', total: '应收总额', paid: '已收金额', unpaid: '待收金额', new: '新建应收', pay: '登记收款' }
    : { type: '应付账款', total: '应付总额', paid: '已付金额', unpaid: '待付金额', new: '新建应付', pay: '登记付款' }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">财务管理</h1>
        <p className="text-sm text-gray-500 mt-1">管理应收账款和应付账款</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[{ key: 'receivable', label: '应收账款' }, { key: 'payable', label: '应付账款' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <CreditCard size={15} />{t.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { title: label.total, value: totalAmount, color: 'bg-blue-50 text-blue-700' },
          { title: label.paid, value: paidAmount, color: 'bg-green-50 text-green-700' },
          { title: label.unpaid, value: unpaidAmount, color: 'bg-red-50 text-red-700' },
        ].map(c => (
          <div key={c.title} className={`rounded-xl p-4 ${c.color}`}>
            <p className="text-sm font-medium opacity-80">{c.title}</p>
            <p className="text-2xl font-bold mt-1">¥{c.value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={() => { setInvForm(emptyInv); setInvModal(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={16} />{label.new}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['单据号', '往来方', '单据日期', '到期日', '金额', '已付', '状态', '操作'].map(h =>
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
              )}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={8} className="text-center py-10 text-gray-400">加载中...</td></tr>
              : invoices.length === 0 ? <tr><td colSpan={8} className="text-center py-10 text-gray-400">暂无数据</td></tr>
              : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-4 py-3 font-medium">{inv.party_name}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.invoice_date}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.due_date || '-'}</td>
                  <td className="px-4 py-3 font-medium">¥{inv.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-green-600">¥{inv.paid_amount.toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge status={inv.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {inv.status !== 'paid' && (
                        <button onClick={() => { setSelectedInv(inv); setPayForm({ payment_date: new Date().toISOString().slice(0,10), amount: inv.amount - inv.paid_amount, method: 'bank_transfer', reference: '', notes: '' }); setPayModal(true) }}
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 border border-green-200 rounded px-2 py-1">
                          <DollarSign size={12} />{label.pay}
                        </button>
                      )}
                      <button onClick={async () => { if (confirm('确认删除？')) { await deleteInvoice(inv.id); load() } }}
                        className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <Modal open={invModal} onClose={() => setInvModal(false)} title={label.new}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">往来方名称*</label>
            <input value={invForm.party_name} onChange={e => setInvForm(p => ({ ...p, party_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">单据日期</label>
              <input type="date" value={invForm.invoice_date} onChange={e => setInvForm(p => ({ ...p, invoice_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">到期日</label>
              <input type="date" value={invForm.due_date} onChange={e => setInvForm(p => ({ ...p, due_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金额*</label>
            <input type="number" min="0" value={invForm.amount} onChange={e => setInvForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea value={invForm.notes} onChange={e => setInvForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setInvModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
          <button onClick={handleCreateInv} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? '创建中...' : '创建'}
          </button>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title={`${label.pay}: ${selectedInv?.invoice_number}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">付款日期</label>
            <input type="date" value={payForm.payment_date} onChange={e => setPayForm(p => ({ ...p, payment_date: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">金额*</label>
            <input type="number" min="0" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">付款方式</label>
            <select value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="cash">现金</option>
              <option value="bank_transfer">银行转账</option>
              <option value="check">支票</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">参考单号</label>
            <input value={payForm.reference} onChange={e => setPayForm(p => ({ ...p, reference: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setPayModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
          <button onClick={handlePay} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {saving ? '登记中...' : '确认登记'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
