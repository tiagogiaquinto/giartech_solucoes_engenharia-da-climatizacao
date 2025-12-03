// Service Worker Avançado com Modo Offline Inteligente
const CACHE_VERSION = 'giartech-v2.0.0'
const CACHE_STATIC = `${CACHE_VERSION}-static`
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`
const CACHE_API = `${CACHE_VERSION}-api`
const MAX_DYNAMIC_CACHE = 50
const MAX_API_CACHE = 100

// Recursos estáticos para cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png'
]

// URLs da API para cache offline
const API_ENDPOINTS_TO_CACHE = [
  '/rest/v1/service_orders',
  '/rest/v1/customers',
  '/rest/v1/inventory_items',
  '/rest/v1/employees',
  '/rest/v1/agenda_events'
]

// ==================================
// INSTALL - Cachear recursos estáticos
// ==================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2...', CACHE_VERSION)

  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Install error:', err))
  )
})

// ==================================
// ACTIVATE - Limpar caches antigos
// ==================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v2...', CACHE_VERSION)

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Deletar caches que não são da versão atual
            if (!cacheName.startsWith(CACHE_VERSION)) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service Worker activated and ready!')
        return self.clients.claim()
      })
      .catch(err => console.error('[SW] Activate error:', err))
  )
})

// ==================================
// FETCH - Estratégia inteligente de cache
// ==================================
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requisições cross-origin exceto Supabase
  if (!url.origin.includes(self.location.origin) && !url.origin.includes('supabase.co')) {
    return
  }

  // Ignorar requisições POST/PUT/DELETE (apenas GET)
  if (request.method !== 'GET') {
    return
  }

  // Estratégia: Network First com fallback para Cache
  event.respondWith(
    networkFirstStrategy(request)
  )
})

// ==================================
// ESTRATÉGIA: Network First
// ==================================
async function networkFirstStrategy(request) {
  try {
    // Tentar buscar da rede primeiro
    const networkResponse = await fetch(request)

    // Se sucesso, cachear a resposta
    if (networkResponse && networkResponse.status === 200) {
      const cache = await getCacheForRequest(request)

      // Clonar resposta antes de cachear
      const responseToCache = networkResponse.clone()

      // Cachear de forma assíncrona
      cache.put(request, responseToCache).catch(err => {
        console.warn('[SW] Cache put error:', err)
      })

      // Limitar tamanho do cache
      trimCache(cache)
    }

    return networkResponse

  } catch (error) {
    // Sem rede: buscar do cache
    console.log('[SW] Network failed, trying cache for:', request.url)

    const cache = await getCacheForRequest(request)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      console.log('[SW] Returning cached response for:', request.url)
      return cachedResponse
    }

    // Sem cache também: retornar página offline
    if (request.destination === 'document') {
      const offlineCache = await caches.open(CACHE_STATIC)
      const offlineResponse = await offlineCache.match('/index.html')
      if (offlineResponse) {
        return offlineResponse
      }
    }

    // Último recurso: erro
    return new Response('Offline - Sem dados em cache', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    })
  }
}

// ==================================
// HELPER: Selecionar cache correto
// ==================================
async function getCacheForRequest(request) {
  const url = new URL(request.url)

  // API Supabase
  if (url.pathname.includes('/rest/v1/')) {
    return caches.open(CACHE_API)
  }

  // Assets estáticos
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff|woff2)$/)) {
    return caches.open(CACHE_STATIC)
  }

  // Páginas dinâmicas
  return caches.open(CACHE_DYNAMIC)
}

// ==================================
// HELPER: Limitar tamanho do cache
// ==================================
async function trimCache(cache) {
  try {
    const keys = await cache.keys()
    const cacheName = (await caches.keys()).find(name => name.startsWith(CACHE_VERSION))

    let maxItems = MAX_DYNAMIC_CACHE
    if (cacheName?.includes('api')) {
      maxItems = MAX_API_CACHE
    }

    if (keys.length > maxItems) {
      // Deletar os mais antigos
      const toDelete = keys.slice(0, keys.length - maxItems)
      await Promise.all(toDelete.map(key => cache.delete(key)))
      console.log(`[SW] Trimmed cache, removed ${toDelete.length} items`)
    }
  } catch (err) {
    console.error('[SW] Trim cache error:', err)
  }
}

// ==================================
// BACKGROUND SYNC - Fila de sincronização
// ==================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests())
  }
})

async function syncPendingRequests() {
  try {
    // Buscar requisições pendentes do IndexedDB
    const pendingRequests = await getPendingRequests()

    if (pendingRequests.length === 0) {
      console.log('[SW] No pending requests to sync')
      return
    }

    console.log(`[SW] Syncing ${pendingRequests.length} pending requests`)

    for (const req of pendingRequests) {
      try {
        await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body
        })

        // Remover da fila após sucesso
        await removePendingRequest(req.id)
        console.log('[SW] Synced request:', req.id)

      } catch (error) {
        console.error('[SW] Failed to sync request:', req.id, error)
      }
    }

    // Notificar cliente sobre sincronização
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        count: pendingRequests.length
      })
    })

  } catch (error) {
    console.error('[SW] Sync error:', error)
  }
}

// ==================================
// HELPER: IndexedDB para fila
// ==================================
async function getPendingRequests() {
  // Simulação - implementar com IndexedDB real
  return []
}

async function removePendingRequest(id) {
  // Simulação - implementar com IndexedDB real
  return true
}

// ==================================
// PUSH NOTIFICATIONS
// ==================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Giartech'
  const options = {
    body: data.message || 'Nova notificação',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: data.tag || 'notification',
    data: data
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// ==================================
// NOTIFICATION CLICK
// ==================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag)

  event.notification.close()

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})

// ==================================
// MESSAGE - Comunicação com cliente
// ==================================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
      })
    )
  }

  if (event.data?.type === 'CACHE_API_DATA') {
    event.waitUntil(
      caches.open(CACHE_API).then(cache => {
        return cache.put(event.data.url, new Response(JSON.stringify(event.data.data)))
      })
    )
  }
})

console.log('[SW] Service Worker v2 script loaded!')
