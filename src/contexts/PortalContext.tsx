import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export interface PortalUser {
  account_id: string
  full_name: string
  email: string
  role: 'cliente' | 'parceiro'
  linked_customer_id: string | null
  linked_partner_id: string | null
  token: string
}

interface PortalContextType {
  portalUser: PortalUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const PortalContext = createContext<PortalContextType | undefined>(undefined)

const STORAGE_KEY = 'portal_session_token'
const BYPASS_AUTH_UNTIL = Date.now() + 10 * 60 * 1000

export const usePortal = () => {
  const context = useContext(PortalContext)
  if (!context) throw new Error('usePortal must be used within a PortalProvider')
  return context
}

export const PortalProvider = ({ children }: { children: ReactNode }) => {
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Bypass temporário de acesso — sem autenticação por 10 min
    if (Date.now() < BYPASS_AUTH_UNTIL) {
      setPortalUser({
        account_id: 'bypass',
        full_name: 'Acesso Temporário',
        email: 'bypass@giartech.com',
        role: 'cliente',
        linked_customer_id: null,
        linked_partner_id: null,
        token: 'bypass'
      })
      setIsLoading(false)
      return
    }
    const token = localStorage.getItem(STORAGE_KEY)
    if (token) {
      validateSession(token)
    } else {
      setIsLoading(false)
    }
  }, [])

  const validateSession = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('portal_validate_session', { p_token: token })
      if (error || !data?.valid) {
        localStorage.removeItem(STORAGE_KEY)
        setPortalUser(null)
      } else {
        setPortalUser({ ...data, token })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.rpc('portal_login', {
      p_email: email,
      p_password: password
    })
    if (error) throw new Error('Erro ao conectar. Tente novamente.')
    if (!data?.success) throw new Error(data?.error || 'Credenciais inválidas')

    localStorage.setItem(STORAGE_KEY, data.token)
    setPortalUser({
      account_id: data.account_id,
      full_name: data.full_name,
      email,
      role: data.role,
      linked_customer_id: data.linked_customer_id,
      linked_partner_id: data.linked_partner_id,
      token: data.token
    })
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setPortalUser(null)
  }

  return (
    <PortalContext.Provider value={{
      portalUser,
      isLoading,
      isAuthenticated: !!portalUser,
      login,
      logout
    }}>
      {children}
    </PortalContext.Provider>
  )
}
