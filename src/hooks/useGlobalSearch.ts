/**
 * Hook para gerenciar busca global
 * Atalho Cmd+K / Ctrl+K
 */

import { useState, useEffect } from 'react'

export function useGlobalSearch() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) ou Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault() // IMPORTANTE: Previne busca do navegador
        e.stopPropagation() // Para a propagação do evento
        setIsSearchOpen(prev => !prev)
      }

      // Esc para fechar
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
      }
    }

    // Usar capture phase (true) para pegar o evento antes
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [])

  return {
    isSearchOpen,
    openSearch: () => setIsSearchOpen(true),
    closeSearch: () => setIsSearchOpen(false)
  }
}
