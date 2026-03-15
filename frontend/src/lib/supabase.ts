import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mynwocqffdrpxyxyygoz.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_MGsdYaWodRl8Zei7PCZuzg_7B-8CceJ'

export const supabase = createClient(supabaseUrl, supabaseKey)
