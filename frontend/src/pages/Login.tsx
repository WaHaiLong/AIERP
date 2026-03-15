import { useState, type FormEvent } from 'react'
import { Building2, Mail, Lock, Loader2, Shield, Users, BarChart3 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const { signIn } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('登录失败，请检查您的凭据后重试。')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ====== Left Brand Panel (hidden on mobile) ====== */}
      <div
        className="hidden lg:flex lg:w-[60%] relative overflow-hidden flex-col justify-between p-12 text-white"
        style={{ background: 'linear-gradient(135deg, #2B5AED 0%, #1a47d1 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/5" />
          <div className="absolute top-1/3 right-[-120px] w-[400px] h-[400px] rounded-full bg-white/5" />
          <div className="absolute bottom-[-80px] left-1/4 w-[350px] h-[350px] rounded-full bg-white/5" />
          <div className="absolute top-[15%] left-[55%] w-[200px] h-[200px] rounded-full bg-white/[0.03]" />
          {/* Grid dots overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-wide">
            智能云端
            <br />
            赋能企业
          </h1>
          <p className="mt-5 text-lg text-blue-100 leading-relaxed">
            新一代智能企业资源规划平台，以 AI 驱动业务决策，
            <br className="hidden xl:block" />
            助力企业实现数字化转型与高效管理。
          </p>
        </div>

        {/* Bottom feature icons */}
        <div className="relative z-10 flex gap-10 pt-8 border-t border-white/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <span className="text-sm text-blue-100">安全可靠</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <Users size={20} />
            </div>
            <span className="text-sm text-blue-100">高效协同</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <span className="text-sm text-blue-100">智能分析</span>
          </div>
        </div>
      </div>

      {/* ====== Right Login Form Panel ====== */}
      <div className="w-full lg:w-[40%] bg-white flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2B5AED, #1a47d1)' }}
            >
              <Building2 size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-wide">AI-ERP</span>
          </div>

          {/* Welcome title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">欢迎登录</h2>
          <p className="text-sm text-gray-400 mb-8">请输入您的账号信息以继续</p>

          {/* Error message */}
          {error && (
            <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              <span className="mt-0.5 shrink-0">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                电子邮箱
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入电子邮箱"
                  className="w-full h-[44px] pl-10 pr-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-[#2B5AED] focus:shadow-[0_0_0_3px_rgba(43,90,237,0.1)]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                登录密码
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入登录密码"
                  className="w-full h-[44px] pl-10 pr-4 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-[#2B5AED] focus:shadow-[0_0_0_3px_rgba(43,90,237,0.1)]"
                />
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#2B5AED] focus:ring-[#2B5AED] cursor-pointer"
                />
                <span className="text-sm text-gray-600">记住我</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => e.preventDefault()}
                className="text-sm text-[#2B5AED] hover:text-[#1a47d1] transition-colors"
              >
                忘记密码?
              </a>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[44px] flex items-center justify-center gap-2 rounded-lg text-white font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading ? '#6b8de8' : '#2B5AED',
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget.style.background = '#1a47d1')
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.currentTarget.style.background = '#2B5AED')
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>登录中...</span>
                </>
              ) : (
                <span>登 录</span>
              )}
            </button>
          </form>

          {/* Demo account hint */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              演示账号：
              <span className="text-gray-500 font-mono">demo@example.com</span>
              {' / '}
              <span className="text-gray-500 font-mono">demo123456</span>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-300 text-xs mt-10">
            &copy; {new Date().getFullYear()} AI-ERP 企业资源规划系统
          </p>
        </div>
      </div>
    </div>
  )
}
