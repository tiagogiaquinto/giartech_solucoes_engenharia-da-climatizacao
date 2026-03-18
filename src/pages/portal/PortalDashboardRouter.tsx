import React from 'react'
import { usePortal } from '../../contexts/PortalContext'
import CustomerPortalDashboard from './CustomerPortalDashboard'
import PartnerPortalDashboard from './PartnerPortalDashboard'

export default function PortalDashboardRouter() {
  const { portalUser } = usePortal()
  if (portalUser?.role === 'parceiro') return <PartnerPortalDashboard />
  return <CustomerPortalDashboard />
}
