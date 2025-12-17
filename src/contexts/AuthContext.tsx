import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export type AccessLevel = 'admin' | 'manager' | 'user' | 'viewer'

export interface ModulePermission {
  module_code: string
  module_name: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  can_approve: boolean
  can_export: boolean
}

export interface UserAccount {
  id: string
  email: string
  full_name: string
  phone?: string
  access_level: AccessLevel
  is_active: boolean
  is_email_verified: boolean
  department_code?: string

  can_invite_users: boolean
  can_manage_permissions: boolean
  can_view_financial: boolean
  can_edit_financial: boolean
  can_approve_financial: boolean
  can_manage_employees: boolean
  can_manage_customers: boolean
  can_manage_service_orders: boolean
  can_manage_inventory: boolean
  can_view_reports: boolean
  can_export_data: boolean

  module_permissions: ModulePermission[]
  last_login_at?: string
  created_at: string
}

interface AuthContextType {
  currentUser: UserAccount | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean

  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>

  hasModuleAccess: (moduleCode: string, action?: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export') => boolean
  hasLegacyPermission: (permission: keyof UserAccount) => boolean

  logActivity: (activityType: string, moduleCode?: string, details?: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionId] = useState(() => Math.random().toString(36).substring(7))

  useEffect(() => {
    loadMockUser()
  }, [])

  const loadMockUser = async () => {
    try {
      const mockUser: UserAccount = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@giartech.com',
        full_name: 'Administrador do Sistema',
        access_level: 'admin',
        is_active: true,
        is_email_verified: true,

        can_invite_users: true,
        can_manage_permissions: true,
        can_view_financial: true,
        can_edit_financial: true,
        can_approve_financial: true,
        can_manage_employees: true,
        can_manage_customers: true,
        can_manage_service_orders: true,
        can_manage_inventory: true,
        can_view_reports: true,
        can_export_data: true,

        module_permissions: [],
        created_at: new Date().toISOString()
      }

      setCurrentUser(mockUser)
      await logActivity('page_load', 'dashboard')
    } catch (error) {
      console.error('Error loading mock user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Usuário não encontrado ou inativo')

      const { data: permissionsData } = await supabase
        .from('user_module_permissions')
        .select(`
          module_code,
          can_view,
          can_create,
          can_edit,
          can_delete,
          can_approve,
          can_export,
          module:system_modules(module_name)
        `)
        .eq('user_id', data.id)

      const userAccount: UserAccount = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        access_level: data.access_level,
        is_active: data.is_active,
        is_email_verified: data.is_email_verified,
        department_code: data.department_code,

        can_invite_users: data.can_invite_users,
        can_manage_permissions: data.can_manage_permissions,
        can_view_financial: data.can_view_financial,
        can_edit_financial: data.can_edit_financial,
        can_approve_financial: data.can_approve_financial,
        can_manage_employees: data.can_manage_employees,
        can_manage_customers: data.can_manage_customers,
        can_manage_service_orders: data.can_manage_service_orders,
        can_manage_inventory: data.can_manage_inventory,
        can_view_reports: data.can_view_reports,
        can_export_data: data.can_export_data,

        module_permissions: permissionsData?.map(p => ({
          module_code: p.module_code,
          module_name: (p.module as any)?.module_name || p.module_code,
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
          can_approve: p.can_approve,
          can_export: p.can_export
        })) || [],
        last_login_at: data.last_login_at,
        created_at: data.created_at
      }

      await supabase
        .from('user_accounts')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.id)

      setCurrentUser(userAccount)

      await logActivity('login', null, { email, success: true })

    } catch (error: any) {
      console.error('Login error:', error)
      await logActivity('login', null, { email, success: false, error: error.message })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      if (currentUser) {
        await logActivity('logout')
      }
      setCurrentUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const hasModuleAccess = (
    moduleCode: string,
    action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' = 'view'
  ): boolean => {
    if (!currentUser) return false
    if (currentUser.access_level === 'admin') return true

    const permission = currentUser.module_permissions.find(p => p.module_code === moduleCode)
    if (!permission) return false

    switch (action) {
      case 'view': return permission.can_view
      case 'create': return permission.can_create
      case 'edit': return permission.can_edit
      case 'delete': return permission.can_delete
      case 'approve': return permission.can_approve
      case 'export': return permission.can_export
      default: return false
    }
  }

  const hasLegacyPermission = (permission: keyof UserAccount): boolean => {
    if (!currentUser) return false
    if (currentUser.access_level === 'admin') return true

    const value = currentUser[permission]
    return typeof value === 'boolean' ? value : false
  }

  const logActivity = async (
    activityType: string,
    moduleCode?: string | null,
    details?: any
  ) => {
    try {
      if (!currentUser) return

      await supabase.rpc('log_user_activity', {
        p_user_id: currentUser.id,
        p_activity_type: activityType,
        p_module_code: moduleCode,
        p_metadata: details || {}
      })
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }

  const value: AuthContextType = {
    currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.access_level === 'admin',

    login,
    logout,

    hasModuleAccess,
    hasLegacyPermission,

    logActivity
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
