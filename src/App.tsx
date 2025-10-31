import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './contexts/UserContext'
import WebLayout from './components/layouts/WebLayout'
import WebDashboard from './components/web/WebDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <WebLayout>
          <WebDashboard />
        </WebLayout>
      </UserProvider>
    </BrowserRouter>
  )
}
