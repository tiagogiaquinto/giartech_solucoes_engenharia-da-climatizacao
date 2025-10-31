/**
 * PWA Utilities
 * Funções para Progressive Web App
 */

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        registration => {
          console.log('ServiceWorker registrado:', registration.scope)
        },
        error => {
          console.log('ServiceWorker falhou:', error)
        }
      )
    })
  }
}

export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true
}

export function canInstallPWA(): boolean {
  return !isStandalone() && 'serviceWorker' in navigator
}
