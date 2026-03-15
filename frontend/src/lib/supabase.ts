import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mynwocqffdrpxyxyygoz.supabase.co'
const supabaseKey = 'sb_publishable_MGsdYaWodRl8Zei7PCZuzg_7B-8CceJ'

export const supabase = createClient(supabaseUrl, supabaseKey)
