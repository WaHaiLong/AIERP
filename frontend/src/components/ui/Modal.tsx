import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClass[size]} max-h-[90vh] flex flex-col`}>
        {/* Title bar - 48px height, bottom border, 16px bold */}
        <div className="flex items-center justify-between px-5 shrink-0 border-b border-[#e5e6eb]" style={{ height: '48px' }}>
          <h3 className="text-base font-semibold text-[#1D2129]">{title}</h3>
          <button onClick={onClose} className="text-[#86909C] hover:text-[#4E5969] transition-colors">
            <X size={18} />
          </button>
        </div>
        {/* Content area - 20px padding */}
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
