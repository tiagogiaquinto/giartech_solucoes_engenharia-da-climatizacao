import { ThomazAI } from '../components/ThomazAI'
import { useUser } from '../contexts/UserContext'

export default function ThomazChat() {
  const { user } = useUser()

  return (
    <ThomazAI
      userId={user?.id}
      userRole={user?.role || 'user'}
      companyId={undefined}
      userName={user?.name}
    />
  )
}
