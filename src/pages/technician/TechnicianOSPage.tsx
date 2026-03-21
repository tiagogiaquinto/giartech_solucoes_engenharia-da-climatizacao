import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import OSExecutionDrawer from '../../components/technician/OSExecutionDrawer'

interface OSOrder {
  id: string
  order_number: string
  status: string
  priority: string
  title?: string
  description?: string
  client_name?: string
  client_phone?: string
  client_address?: string
  client_city?: string
  scheduled_at?: string
  scheduled_time?: string
  equipment?: string
  brand?: string
  model?: string
  progress_percent?: number
}

export default function TechnicianOSPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OSOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const { data } = await supabase
        .from('service_orders')
        .select(`
          id, order_number, status, priority, title, description,
          client_name, client_phone, client_address, client_city,
          scheduled_at, scheduled_time, equipment, brand, model, progress_percent
        `)
        .eq('id', id)
        .maybeSingle()
      setOrder(data as OSOrder | null)
      setLoading(false)
    }
    load()
  }, [id])

  const handleClose = () => navigate('/tecnico', { replace: true })
  const handleFinished = () => navigate('/tecnico', { replace: true })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <OSExecutionDrawer
        order={order}
        onClose={handleClose}
        onFinished={handleFinished}
      />
    </div>
  )
}
