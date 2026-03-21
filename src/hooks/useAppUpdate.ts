import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface AppVersion {
  version: string
  release_notes: string
  force_reload: boolean
  build_at: string
}

interface UseAppUpdateReturn {
  updateAvailable: boolean
  newVersion: AppVersion | null
  applyUpdate: () => void
  dismissUpdate: () => void
}

const CURRENT_VERSION_KEY = 'giartech_app_version'

export function useAppUpdate(): UseAppUpdateReturn {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [newVersion, setNewVersion] = useState<AppVersion | null>(null)
  const currentVersion = useRef<string | null>(localStorage.getItem(CURRENT_VERSION_KEY))

  useEffect(() => {
    const initVersion = async () => {
      const { data } = await supabase
        .from('app_version')
        .select('version, release_notes, force_reload, build_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!data) return

      if (!currentVersion.current) {
        currentVersion.current = data.version
        localStorage.setItem(CURRENT_VERSION_KEY, data.version)
        return
      }

      if (data.version !== currentVersion.current) {
        setNewVersion(data as AppVersion)
        setUpdateAvailable(true)

        if (data.force_reload) {
          setTimeout(() => {
            localStorage.setItem(CURRENT_VERSION_KEY, data.version)
            window.location.reload()
          }, 1500)
        }
      }
    }

    initVersion()

    const channel = supabase
      .channel('app-version-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'app_version' },
        (payload) => {
          const incoming = payload.new as AppVersion & { version: string }
          if (incoming.version === currentVersion.current) return

          setNewVersion(incoming)
          setUpdateAvailable(true)

          if (incoming.force_reload) {
            setTimeout(() => {
              localStorage.setItem(CURRENT_VERSION_KEY, incoming.version)
              window.location.reload()
            }, 1500)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const applyUpdate = () => {
    if (newVersion) {
      localStorage.setItem(CURRENT_VERSION_KEY, newVersion.version)
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.update())
      })
    }
    window.location.reload()
  }

  const dismissUpdate = () => {
    if (newVersion) {
      localStorage.setItem(CURRENT_VERSION_KEY, newVersion.version)
      currentVersion.current = newVersion.version
    }
    setUpdateAvailable(false)
    setNewVersion(null)
  }

  return { updateAvailable, newVersion, applyUpdate, dismissUpdate }
}
