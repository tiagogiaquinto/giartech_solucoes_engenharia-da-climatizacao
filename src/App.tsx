import React from 'react'
import { UserProvider } from './contexts/UserContext'
import WebLayout from './components/layouts/WebLayout'
import WebDashboard from './components/web/WebDashboard'

export default function App() {
  return (
    <UserProvider>
      <WebLayout>
        <WebDashboard />
      </WebLayout>
    </UserProvider>
  )
}
