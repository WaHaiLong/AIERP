import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: string
  subtitle?: string
}

export default function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E6EB] p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-[#86909C]">{title}</p>
        <p className="text-2xl font-bold text-[#1D2129]">{value}</p>
        {subtitle && <p className="text-xs text-[#C9CDD4] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
