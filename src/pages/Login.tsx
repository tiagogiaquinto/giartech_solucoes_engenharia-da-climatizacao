import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Página de Login - Sistema sem Autenticação
 *
 * Esta página simplesmente redireciona para a home.
 * O sistema não requer login ou senha.
 */
const Login = () => {
  const navigate = useNavigate()

  // Sistema sem autenticação - redirecionar imediatamente para home
  useEffect(() => {
    navigate('/', { replace: true })
  }, [navigate])

  // Renderizar tela de carregamento enquanto redireciona
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-lg">Carregando sistema...</p>
      </div>
    </div>
  )
}

export default Login
