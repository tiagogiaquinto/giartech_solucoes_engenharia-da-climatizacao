// PWA Utilities

// Registrar Service Worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ SW registered:', registration)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New SW available
                  console.log('🆕 New SW available')
                  showUpdateNotification()
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('❌ SW registration failed:', error)
        })
    })
  }
}

// Mostrar notificação de atualização
function showUpdateNotification() {
  if (confirm('Nova versão disponível! Deseja atualizar agora?')) {
    window.location.reload()
  }
}

// Verificar se está instalado como PWA
export function isInstalledPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
}

// Solicitar permissão para notificações
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notificações não suportadas')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission
  }

  return Notification.permission
}

// Mostrar notificação local
export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon: '/icon.png',
        badge: '/icon.png',
        ...options
      })
    })
  }
}

// Verificar suporte a PWA
export function checkPWASupport() {
  const support = {
    serviceWorker: 'serviceWorker' in navigator,
    notifications: 'Notification' in window,
    pushManager: 'PushManager' in window,
    backgroundSync: 'sync' in (window.ServiceWorkerRegistration?.prototype || {}),
    periodicSync: 'periodicSync' in (window.ServiceWorkerRegistration?.prototype || {})
  }

  console.log('PWA Support:', support)
  return support
}

// Detectar se é mobile
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Detectar se é iOS
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

// Detectar se é Android
export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent)
}

// Obter tipo de device
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth

  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// Vibrar dispositivo (se suportado)
export function vibrate(pattern: number | number[] = 200) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

// Compartilhar (Web Share API)
export async function share(data: ShareData): Promise<boolean> {
  if ('share' in navigator) {
    try {
      await navigator.share(data)
      return true
    } catch (error) {
      console.error('Error sharing:', error)
      return false
    }
  }
  return false
}

// Detectar conexão
export function getConnectionInfo() {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

  if (!connection) {
    return null
  }

  return {
    effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
    downlink: connection.downlink, // Mbps
    rtt: connection.rtt, // ms
    saveData: connection.saveData // boolean
  }
}

// Verificar se está online
export function isOnline(): boolean {
  return navigator.onLine
}

// Event listeners para status da conexão
export function setupConnectionListeners(
  onOnline: () => void,
  onOffline: () => void
) {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}

// Instalar PWA (apenas quando disponível)
let deferredPrompt: any = null

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA install prompt available')
    e.preventDefault()
    deferredPrompt = e
  })
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('Install prompt not available')
    return false
  }

  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice

  console.log(`User response: ${outcome}`)
  deferredPrompt = null

  return outcome === 'accepted'
}

export function canInstall(): boolean {
  return deferredPrompt !== null
}
