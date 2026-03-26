import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, Marker, Circle, LatLngExpression } from 'leaflet'

export interface TrackingStop {
  id: string
  label: string
  lat: number
  lng: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  eta_minutes?: number
}

export interface TechnicianPosition {
  employeeId: string
  name: string
  lat: number
  lng: number
  heading?: number
  speed_kmh?: number
  updated_at: string
}

interface LiveTrackingMapProps {
  technicians: TechnicianPosition[]
  stops?: TrackingStop[]
  center?: [number, number]
  zoom?: number
  height?: string
  showGeofenceRings?: boolean
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const toRad = (v: number) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function computeETA(
  techLat: number, techLng: number,
  destLat: number, destLng: number,
  speedKmh = 30
): number {
  const dist = haversineKm(techLat, techLng, destLat, destLng)
  return Math.round((dist / speedKmh) * 60)
}

export default function LiveTrackingMap({
  technicians,
  stops = [],
  center,
  zoom = 13,
  height = '100%',
  showGeofenceRings = true,
}: LiveTrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const techMarkersRef = useRef<Map<string, Marker>>(new Map())
  const stopMarkersRef = useRef<Marker[]>([])
  const geofenceRingsRef = useRef<Circle[]>([])

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return

    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const defaultCenter: LatLngExpression = center
        ? center
        : technicians.length > 0
          ? [technicians[0].lat, technicians[0].lng]
          : [-23.5505, -46.6333]

      const map = L.map(containerRef.current!, {
        center: defaultCenter,
        zoom,
        zoomControl: true,
        attributionControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map)

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        techMarkersRef.current.clear()
        stopMarkersRef.current = []
        geofenceRingsRef.current = []
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      const map = mapRef.current!

      stopMarkersRef.current.forEach(m => m.remove())
      stopMarkersRef.current = []
      geofenceRingsRef.current.forEach(c => c.remove())
      geofenceRingsRef.current = []

      stops.forEach((stop, idx) => {
        const color =
          stop.status === 'completed' ? '#16a34a' :
          stop.status === 'in_progress' ? '#2563eb' :
          stop.status === 'skipped' ? '#9ca3af' : '#f59e0b'

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:32px;height:32px;border-radius:50% 50% 50% 0;
            background:${color};border:2px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,.35);
            display:flex;align-items:center;justify-content:center;
            transform:rotate(-45deg);
          ">
            <span style="transform:rotate(45deg);color:white;font-weight:700;font-size:12px">${idx + 1}</span>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        })

        const etaText = stop.eta_minutes !== undefined
          ? `<br><span style="color:#2563eb;font-weight:600">ETA: ${stop.eta_minutes} min</span>`
          : ''

        const marker = L.marker([stop.lat, stop.lng], { icon })
          .bindPopup(`<b>${stop.label}</b>${etaText}<br><small style="color:#6b7280;text-transform:capitalize">${stop.status}</small>`)
          .addTo(map)

        stopMarkersRef.current.push(marker)

        if (showGeofenceRings) {
          const ring = L.circle([stop.lat, stop.lng], {
            radius: 100,
            color: color,
            fillColor: color,
            fillOpacity: 0.08,
            weight: 1,
            dashArray: '6 4',
          }).addTo(map)
          geofenceRingsRef.current.push(ring)
        }
      })
    })
  }, [stops, showGeofenceRings])

  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then(L => {
      const map = mapRef.current!

      const seen = new Set<string>()

      technicians.forEach(tech => {
        seen.add(tech.employeeId)

        const existingMarker = techMarkersRef.current.get(tech.employeeId)

        const initials = tech.name
          .split(' ')
          .slice(0, 2)
          .map(n => n[0])
          .join('')
          .toUpperCase()

        const speedText = tech.speed_kmh !== undefined && tech.speed_kmh > 0
          ? `${Math.round(tech.speed_kmh)} km/h`
          : 'parado'

        const mins = Math.floor(
          (Date.now() - new Date(tech.updated_at).getTime()) / 60000
        )
        const agoText = mins < 1 ? 'agora' : `${mins} min atrás`

        if (existingMarker) {
          existingMarker.setLatLng([tech.lat, tech.lng])
          existingMarker
            .getPopup()
            ?.setContent(`<b>${tech.name}</b><br><small>${speedText} · ${agoText}</small>`)
        } else {
          const icon = L.divIcon({
            className: '',
            html: `<div style="
              width:36px;height:36px;border-radius:50%;
              background:#1e3a5f;border:3px solid #fff;
              box-shadow:0 3px 10px rgba(0,0,0,.4);
              display:flex;align-items:center;justify-content:center;
              position:relative;
            ">
              <span style="color:white;font-weight:700;font-size:12px">${initials}</span>
              <span style="
                position:absolute;bottom:-4px;right:-4px;
                width:10px;height:10px;border-radius:50%;
                background:#22c55e;border:2px solid white;
              "></span>
            </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          })

          const marker = L.marker([tech.lat, tech.lng], { icon, zIndexOffset: 1000 })
            .bindPopup(`<b>${tech.name}</b><br><small>${speedText} · ${agoText}</small>`)
            .addTo(map)

          techMarkersRef.current.set(tech.employeeId, marker)
        }
      })

      techMarkersRef.current.forEach((marker, id) => {
        if (!seen.has(id)) {
          marker.remove()
          techMarkersRef.current.delete(id)
        }
      })

      if (technicians.length === 1 && !center) {
        map.setView([technicians[0].lat, technicians[0].lng], zoom)
      }
    })
  }, [technicians, center, zoom])

  return (
    <div style={{ height, width: '100%', borderRadius: 'inherit', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
