import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

const DEMO_USER: User = {
  id: 'demo-user',
  email: 'admin@erp.com',
  full_name: '系统管理员',
  role: 'admin',
}

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signIn: async (email, password) => {
    // Try demo login first
    if ((email === 'admin@erp.com' || email === 'demo@example.com') && password === 'demo123456') {
      localStorage.setItem('erp_demo_user', JSON.stringify(DEMO_USER))
      set({ user: DEMO_USER })
      return
    }
    // Try Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const u = data.user
    set({ user: { id: u.id, email: u.email!, full_name: u.user_metadata?.full_name, role: u.user_metadata?.role || 'staff' } })
  },

  signOut: async () => {
    localStorage.removeItem('erp_demo_user')
    await supabase.auth.signOut()
    set({ user: null })
  },

  checkAuth: async () => {
    // Check local demo user
    const stored = localStorage.getItem('erp_demo_user')
    if (stored) {
      set({ user: JSON.parse(stored), loading: false })
      return
    }
    // Check Supabase session
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      const u = data.session.user
      set({ user: { id: u.id, email: u.email!, full_name: u.user_metadata?.full_name, role: u.user_metadata?.role || 'staff' }, loading: false })
    } else {
      set({ loading: false })
    }
  },
}))
