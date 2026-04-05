import { useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'

interface SecurityGuardOptions {
  moduleCode?: string
  redirectTo403?: boolean
}

export function useSecurityGuard({ moduleCode, redirectTo403 = true }: SecurityGuardOptions = {}) {
  const { user, profile, isSuperAdmin, hasModuleAccess, refreshPermissions } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const loggedRef = useRef(false)

  const logAttempt = useCallback(async (route: string, code?: string) => {
    if (!user || loggedRef.current) return
    loggedRef.current = true
    await supabase.from('security_audit_logs').insert({
      user_id: user.id,
      user_email: user.email ?? '',
      user_name: user.full_name ?? user.name ?? '',
      route_attempted: route,
      module_code: code ?? null,
      user_agent: navigator.userAgent
    })
  }, [user])

  const isBlocked = !!moduleCode && !isSuperAdmin && !hasModuleAccess(moduleCode, 'view')

  useEffect(() => {
    if (isBlocked && redirectTo403) {
      logAttempt(location.pathname, moduleCode)
      navigate('/access-denied', {
        replace: true,
        state: { attemptedRoute: location.pathname, moduleCode }
      })
    }
  }, [isBlocked, redirectTo403, location.pathname, moduleCode, navigate, logAttempt])

  useEffect(() => {
    if (!user || isSuperAdmin) return

    const userId = user.id
    const channel = supabase
      .channel(`permissions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'module_permissions',
          filter: `user_id=eq.${userId}`
        },
        () => {
          refreshPermissions()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auth_accounts',
          filter: `id=eq.${userId}`
        },
        () => {
          refreshPermissions()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [user?.id, isSuperAdmin, refreshPermissions])

  return { isBlocked, logAttempt }
}

export function useRealtimePermissions() {
  const { user, isSuperAdmin, refreshPermissions } = useUser()

  useEffect(() => {
    if (!user || isSuperAdmin) return

    const userId = user.id
    const channel = supabase
      .channel(`perm-sync:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'module_permissions',
          filter: `user_id=eq.${userId}`
        },
        () => {
          refreshPermissions()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sensitive_permissions',
          filter: `user_id=eq.${userId}`
        },
        () => {
          refreshPermissions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, isSuperAdmin, refreshPermissions])
}
