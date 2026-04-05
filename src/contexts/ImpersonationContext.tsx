import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'impersonation_session'

export interface ImpersonationSession {
  logId: string
  adminEmail: string
  targetName: string
  targetEmail: string
  targetRole: 'cliente' | 'parceiro'
  targetId: string
  portalSessionToken: string
  startedAt: number
}

interface ImpersonationContextValue {
  session: ImpersonationSession | null
  isImpersonating: boolean
  startImpersonation: (portalAccountId: string) => Promise<void>
  endImpersonation: () => Promise<void>
  error: string | null
  loading: boolean
}

const ImpersonationContext = createContext<ImpersonationContextValue | null>(null)

export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<ImpersonationSession | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed: ImpersonationSession = JSON.parse(raw)
        setSession(parsed)
      } catch { /* ignore */ }
    }
  }, [])

  const startImpersonation = useCallback(async (portalAccountId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data: impData, error: impErr } = await supabase.rpc('admin_impersonate_portal', {
        p_portal_account_id: portalAccountId,
      })
      if (impErr) throw impErr

      const { data: loginData, error: loginErr } = await supabase.rpc('portal_login_impersonation', {
        p_token: impData.impersonation_token,
      })
      if (loginErr) throw loginErr

      const sess: ImpersonationSession = {
        logId:              impData.log_id,
        adminEmail:         loginData.admin_email,
        targetName:         loginData.full_name,
        targetEmail:        loginData.email,
        targetRole:         loginData.role as 'cliente' | 'parceiro',
        targetId:           loginData.account_id,
        portalSessionToken: loginData.session_token,
        startedAt:          Date.now(),
      }

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sess))
      setSession(sess)

      localStorage.setItem('portal_session_token', loginData.session_token)

      window.open('/portal/dashboard', '_blank')
    } catch (e: any) {
      const msg = e.message?.includes('ACCESS_DENIED')
        ? 'Acesso negado. Apenas administradores podem usar esta função.'
        : e.message?.includes('PORTAL_ACCOUNT_NOT_FOUND')
        ? 'Conta do portal não encontrada ou inativa.'
        : 'Erro ao iniciar impersonation.'
      setError(msg)
    }
    setLoading(false)
  }, [])

  const endImpersonation = useCallback(async () => {
    if (!session) return
    try {
      await supabase.rpc('admin_end_impersonation', { p_log_id: session.logId })
    } catch { /* ignore, best-effort */ }
    localStorage.removeItem('portal_session_token')
    sessionStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }, [session])

  return (
    <ImpersonationContext.Provider value={{
      session,
      isImpersonating: session !== null,
      startImpersonation,
      endImpersonation,
      error,
      loading,
    }}>
      {children}
    </ImpersonationContext.Provider>
  )
}

export const useImpersonation = () => {
  const ctx = useContext(ImpersonationContext)
  if (!ctx) throw new Error('useImpersonation must be used inside ImpersonationProvider')
  return ctx
}
