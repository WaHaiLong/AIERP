const colors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-yellow-100 text-yellow-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  sent: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  unpaid: 'bg-red-100 text-red-700',
  overdue: 'bg-red-100 text-red-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  terminated: 'bg-red-100 text-red-700',
}

const labels: Record<string, string> = {
  draft: '草稿', confirmed: '已确认', shipped: '已发货', delivered: '已送达',
  cancelled: '已取消', sent: '已发送', received: '已收货',
  paid: '已付款', partial: '部分付款', unpaid: '未付款', overdue: '逾期',
  active: '在职', inactive: '非活跃', terminated: '已离职',
}

export default function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  )
}
