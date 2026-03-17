import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'technician' | 'sales' | 'financial' | 'viewer'

export interface ModulePermission {
  module_code: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

interface UserProfile {
  id: string
  email: string
  name: string
  full_name: string
  role: UserRole
  is_active: boolean
  permissions: ModulePermission[]
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
  hasPermission: (permission: string) => boolean
  hasModuleAccess: (moduleCode: string, action?: 'view' | 'create' | 'edit' | 'delete') => boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  onPremiumFeature?: (feature: string) => void
  refreshPermissions: () => Promise<void>
  employee_id?: string
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          await loadUserProfile(session.user)
        } else {
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

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      const superAdmin = authUser.email === SUPER_ADMIN_EMAIL

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      let resolvedRole: UserRole = 'viewer'
      let isActive = true

      if (profileData) {
        resolvedRole = superAdmin ? 'super_admin' : (profileData.role as UserRole)
        isActive = profileData.is_active ?? true
      } else if (superAdmin) {
        resolvedRole = 'super_admin'
        await supabase.from('user_profiles').upsert({
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
      if (!superAdmin) {
        const { data: perms } = await supabase
          .from('module_permissions')
          .select('module_code, can_view, can_create, can_edit, can_delete')
          .eq('user_id', authUser.id)
        permissions = perms || []
      }

      const userProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        name: profileData?.full_name || authUser.email || 'Usuário',
        full_name: profileData?.full_name || authUser.email || 'Usuário',
        role: resolvedRole,
        is_active: isActive,
        permissions
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
  const isTechnician = profile?.role === 'technician'
  const isExternal = profile?.role === 'viewer'
  const isPremium = isManager
  const isEnterprise = isAdmin

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
      hasPermission,
      hasModuleAccess,
      login,
      logout,
      onPremiumFeature,
      refreshPermissions
    }}>
      {children}
    </UserContext.Provider>
  )
}
