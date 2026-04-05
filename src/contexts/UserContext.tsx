import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'technician' | 'sales' | 'financial' | 'viewer'

export const ROLE_REDIRECT: Record<UserRole, string> = {
  super_admin: '/',
  admin: '/',
  manager: '/',
  sales: '/',
  financial: '/',
  technician: '/tecnico',
  viewer: '/portal/dashboard'
}

export interface ModulePermission {
  module_code: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

export interface SensitivePermissions {
  can_view_profit: boolean
  can_apply_discount: boolean
  can_adjust_stock: boolean
}

interface UserProfile {
  id: string
  email: string
  name: string
  full_name: string
  role: UserRole
  user_type?: string
  is_active: boolean
  permissions: ModulePermission[]
  sensitive: SensitivePermissions
  employee_id?: string
}

interface User extends UserProfile {
  authUser: SupabaseUser
}

interface UserContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isManager: boolean
  isTechnician: boolean
  isExternal: boolean
  isPremium: boolean
  isEnterprise: boolean
  sensitive: SensitivePermissions
  hasPermission: (permission: string) => boolean
  hasModuleAccess: (moduleCode: string, action?: 'view' | 'create' | 'edit' | 'delete') => boolean
  hasSensitiveAccess: (field: keyof SensitivePermissions) => boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  onPremiumFeature?: (feature: string) => void
  refreshPermissions: () => Promise<void>
  employee_id?: string
  redirectPath: string
}

const SUPER_ADMIN_EMAIL = 'diretor.giartechsolucoes@gmail.com'

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
  const currentAuthUserRef = React.useRef<import('@supabase/supabase-js').User | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        currentAuthUserRef.current = session.user
        loadUserProfile(session.user).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          currentAuthUserRef.current = session.user
          await loadUserProfile(session.user)
        } else {
          currentAuthUserRef.current = null
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        }
      })()
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user || user.role === 'super_admin') return

    const userId = user.id
    const channel = supabase
      .channel(`ctx-perms:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'module_permissions', filter: `user_id=eq.${userId}` },
        () => {
          if (currentAuthUserRef.current) loadUserProfile(currentAuthUserRef.current)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sensitive_permissions', filter: `user_id=eq.${userId}` },
        () => {
          if (currentAuthUserRef.current) loadUserProfile(currentAuthUserRef.current)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auth_accounts', filter: `id=eq.${userId}` },
        () => {
          if (currentAuthUserRef.current) loadUserProfile(currentAuthUserRef.current)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, user?.role])

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      const superAdmin = authUser.email === SUPER_ADMIN_EMAIL

      const { data: accountData } = await supabase
        .from('auth_accounts')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      let resolvedRole: UserRole = 'viewer'
      let isActive = true

      if (accountData) {
        resolvedRole = superAdmin ? 'super_admin' : (accountData.role as UserRole)
        isActive = accountData.is_active ?? true
      } else if (superAdmin) {
        resolvedRole = 'super_admin'
        await supabase.from('auth_accounts').upsert({
          id: authUser.id,
          email: authUser.email!,
          full_name: 'Diretor',
          role: 'super_admin',
          is_active: true
        }, { onConflict: 'id' })
      }

      if (!isActive && !superAdmin) {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        return
      }

      let permissions: ModulePermission[] = []
      let sensitive: SensitivePermissions = { can_view_profit: false, can_apply_discount: false, can_adjust_stock: false }

      if (!superAdmin) {
        const [{ data: perms }, { data: sens }] = await Promise.all([
          supabase.from('module_permissions').select('module_code, can_view, can_create, can_edit, can_delete').eq('user_id', authUser.id),
          supabase.from('sensitive_permissions').select('can_view_profit, can_apply_discount, can_adjust_stock').eq('user_id', authUser.id).maybeSingle()
        ])
        permissions = perms || []
        if (sens) sensitive = { can_view_profit: sens.can_view_profit, can_apply_discount: sens.can_apply_discount, can_adjust_stock: sens.can_adjust_stock }
      } else {
        sensitive = { can_view_profit: true, can_apply_discount: true, can_adjust_stock: true }
      }

      let employee_id: string | undefined
      try {
        const { data: empData } = await supabase
          .from('employees')
          .select('id')
          .eq('auth_account_id', authUser.id)
          .maybeSingle()
        employee_id = empData?.id
      } catch { /* no employee linked */ }

      const userProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        name: accountData?.full_name || authUser.email || 'Usuário',
        full_name: accountData?.full_name || authUser.email || 'Usuário',
        role: resolvedRole,
        user_type: accountData?.user_type ?? undefined,
        is_active: isActive,
        permissions,
        sensitive,
        employee_id
      }

      setProfile(userProfile)
      setUser({ ...userProfile, authUser })
    } catch (error) {
      console.error('Error loading user profile:', error)
      setUser(null)
      setProfile(null)
    }
  }

  const refreshPermissions = async () => {
    if (user?.authUser) {
      await loadUserProfile(user.authUser)
    }
  }

  const isSuperAdmin = profile?.role === 'super_admin'
  const isAdmin = isSuperAdmin || profile?.role === 'admin'
  const isManager = isAdmin || profile?.role === 'manager'
  const isTechnician = profile?.role === 'technician' || profile?.user_type === 'tecnico'
  const isExternal = profile?.role === 'viewer'
  const isPremium = isManager
  const isEnterprise = isAdmin
  const redirectPath = profile?.role ? (ROLE_REDIRECT[profile.role] ?? '/') : '/'

  const hasModuleAccess = (
    moduleCode: string,
    action: 'view' | 'create' | 'edit' | 'delete' = 'view'
  ): boolean => {
    if (!profile) return false
    if (isSuperAdmin) return true

    const perm = profile.permissions.find(p => p.module_code === moduleCode)
    if (!perm) return false

    switch (action) {
      case 'view': return perm.can_view
      case 'create': return perm.can_create
      case 'edit': return perm.can_edit
      case 'delete': return perm.can_delete
      default: return false
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false
    if (isSuperAdmin) return true
    return profile.permissions.some(p => p.module_code === permission && p.can_view)
  }

  const hasSensitiveAccess = (field: keyof SensitivePermissions): boolean => {
    if (!profile) return false
    if (isSuperAdmin) return true
    return profile.sensitive?.[field] ?? false
  }

  const sensitive: SensitivePermissions = profile?.sensitive ?? { can_view_profit: false, can_apply_discount: false, can_adjust_stock: false }

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
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
      isSuperAdmin,
      isManager,
      isTechnician,
      isExternal,
      isPremium,
      isEnterprise,
      sensitive,
      hasPermission,
      hasModuleAccess,
      hasSensitiveAccess,
      login,
      logout,
      onPremiumFeature,
      refreshPermissions,
      employee_id: profile?.employee_id,
      redirectPath
    }}>
      {children}
    </UserContext.Provider>
  )
}
