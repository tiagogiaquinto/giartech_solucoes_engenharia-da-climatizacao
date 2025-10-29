// Service Worker for PWA
const CACHE_NAME = 'giartech-v1.0.0'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png'
]

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell')
        return cache.addAll(urlsToCache)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone()

        // Cache the fetched resource
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache)
          })

        return response
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response
            }
            // Return offline page if available
            return caches.match('/index.html')
          })
      })
  )
})

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)

  let data = {}
  if (event.data) {
    data = event.data.json()
  }

  const title = data.title || 'Giartech'
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icon.png',
    badge: '/icon.png',
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event)

  event.notification.close()

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    )
  }
})

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag)

  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

// Sync function
async function syncData() {
  try {
    // Implementar sincronização de dados offline
    console.log('[SW] Syncing data...')
    // TODO: Implement actual sync logic
    return Promise.resolve()
  } catch (error) {
    console.error('[SW] Sync error:', error)
    return Promise.reject(error)
  }
}
