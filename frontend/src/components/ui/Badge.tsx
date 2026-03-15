const colors: Record<string, string> = {
  draft: 'bg-[#f2f3f5] text-[#86909C]',
  confirmed: 'bg-[#e8f3ff] text-[#2B5AED]',
  shipped: 'bg-[#fff7e8] text-[#FF7D00]',
  delivered: 'bg-[#e8ffea] text-[#00B42A]',
  cancelled: 'bg-[#ffece8] text-[#F53F3F]',
  sent: 'bg-[#e8f3ff] text-[#2B5AED]',
  received: 'bg-[#e8ffea] text-[#00B42A]',
  paid: 'bg-[#e8ffea] text-[#00B42A]',
  partial: 'bg-[#fff7e8] text-[#FF7D00]',
  unpaid: 'bg-[#ffece8] text-[#F53F3F]',
  overdue: 'bg-[#ffece8] text-[#F53F3F]',
  active: 'bg-[#e8ffea] text-[#00B42A]',
  inactive: 'bg-[#f2f3f5] text-[#86909C]',
  terminated: 'bg-[#ffece8] text-[#F53F3F]',
}

const labels: Record<string, string> = {
  draft: '草稿', confirmed: '已确认', shipped: '已发货', delivered: '已送达',
  cancelled: '已取消', sent: '已发送', received: '已收货',
  paid: '已付款', partial: '部分付款', unpaid: '未付款', overdue: '逾期',
  active: '在职', inactive: '非活跃', terminated: '已离职',
}

export default function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-[#f2f3f5] text-[#86909C]'}`}>
      {labels[status] || status}
    </span>
  )
}
