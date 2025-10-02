import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jhoyskraszecvcfsmgzj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impob3lza3Jhc3plY3ZjZnNtZ3pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzI1NTksImV4cCI6MjA3NDkwODU1OX0.StpFHrZa-tFJLKYsNdpYeB4lHrxxwu1LcbjZ_kQrERU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

