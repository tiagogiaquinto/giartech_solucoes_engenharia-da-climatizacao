import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import WebDashboard from '../components/web/WebDashboard'
import { useUser } from '../contexts/UserContext'

const Dashboard = () => {
  const { user, isAdmin } = useUser()
  const navigate = useNavigate()

  return <WebDashboard onPremiumFeature={(feature) => {
    console.log('Premium feature:', feature)
  }} />
}

export default Dashboard