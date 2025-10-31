import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'manager' | 'technician' | 'external' | 'viewer'

interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  status: string
  department_id?: string
  phone?: string
  permissions?: string[]
}

interface User extends UserProfile {
  authUser: SupabaseUser
}

interface UserContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAdmin: boolean
  isManager: boolean
  isTechnician: boolean
  isExternal: boolean
  isPremium: boolean
  isEnterprise: boolean
  hasPermission: (permission: string) => boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  onPremiumFeature?: (feature: string) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simular usuário admin logado automaticamente
    // Usar UUID válido para compatibilidade com banco de dados
    const mockAdminId = '00000000-0000-0000-0000-000000000001'

    const mockAdminProfile: UserProfile = {
      id: mockAdminId,
      email: 'admin@sistema.com',
      name: 'Administrador',
      role: 'admin',
      avatar: undefined,
      status: 'active',
      department_id: undefined,
      phone: undefined,
      permissions: ['view_dashboard', 'manage_orders', 'view_orders', 'manage_clients', 'view_clients',
                   'manage_inventory', 'view_inventory', 'manage_financial', 'view_financial',
                   'view_bank_balances', 'manage_users', 'system_settings']
    }

    const mockAuthUser = {
      id: mockAdminId,
      email: 'admin@sistema.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
    } as SupabaseUser

    setProfile(mockAdminProfile)
    setUser({
      ...mockAdminProfile,
      authUser: mockAuthUser
    })
    setIsLoading(false)

    // Comentado: autenticação real
    // checkUser()
    // const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    //   (async () => {
    //     if (session?.user) {
    //       await loadUserProfile(session.user)
    //     } else {
    //       setUser(null)
    //       setProfile(null)
    //       setIsLoading(false)
    //     }
    //   })()
    // })
    // return () => {
    //   authListener?.subscription.unsubscribe()
    // }
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadUserProfile(session.user)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading user profile:', error)
        throw error
      }

      if (data) {
        const userProfile: UserProfile = {
          id: data.id,
          email: authUser.email || '',
          name: data.nome || 'Usuário',
          role: (data.tipo_usuario as UserRole) || 'viewer',
          avatar: undefined,
          status: 'active',
          department_id: data.empresa_id,
          phone: data.telefone
        }
        setProfile(userProfile)
        setUser({
          ...userProfile,
          authUser
        })
      } else {
        console.error('No user profile found for authenticated user')
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      setUser(null)
      setProfile(null)
    }
  }

  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'manager'
  const isTechnician = profile?.role === 'technician'
  const isExternal = profile?.role === 'external'

  const isPremium = isAdmin || isManager
  const isEnterprise = isAdmin

  const hasPermission = (permission: string): boolean => {
    if (isAdmin) return true
    return profile?.permissions?.includes(permission) || false
  }

  const login = async (email: string, password: string) => {
    // Login simulado - sempre bem-sucedido
    console.log('Login simulado:', email)

    // Comentado: login real
    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email,
    //   password
    // })
    // if (error) throw error
    // if (data.user) {
    //   await loadUserProfile(data.user)
    // }
  }

  const logout = async () => {
    // Logout simulado - não faz nada
    console.log('Logout simulado')

    // Comentado: logout real
    // await supabase.auth.signOut()
    // setUser(null)
    // setProfile(null)
  }

  const onPremiumFeature = (feature: string) => {
    console.log('Premium feature requested:', feature)
  }

  return (
    <UserContext.Provider value={{
      user,
      profile,
      isLoading,
      isAdmin,
      isManager,
      isTechnician,
      isExternal,
      isPremium,
      isEnterprise,
      hasPermission,
      login,
      logout,
      onPremiumFeature
    }}>
      {children}
    </UserContext.Provider>
  )
}