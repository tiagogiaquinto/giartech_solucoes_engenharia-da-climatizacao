import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const LAST_RUN_KEY = 'giartech_daily_automations_run'

export function useDailyAutomations() {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const lastRun = localStorage.getItem(LAST_RUN_KEY)

    if (lastRun === today) return

    async function run() {
      try {
        await supabase.rpc('thomaz_check_renewal_opportunities')
        localStorage.setItem(LAST_RUN_KEY, today)
      } catch {
        // silencia erros — automação não crítica
      }
    }

    const timer = setTimeout(run, 3000)
    return () => clearTimeout(timer)
  }, [])
}
