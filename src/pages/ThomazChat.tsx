import { useContext } from 'react'
import { ThomazAI } from '../components/ThomazAI'
import { UserContext } from '../contexts/UserContext'

export default function ThomazChat() {
  const { user } = useContext(UserContext)

  return (
    <ThomazAI
      userId={user?.id}
      userRole={user?.role || 'user'}
      companyId={user?.company_id}
      userName={user?.name}
    />
  )
}
