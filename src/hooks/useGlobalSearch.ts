/**
 * Global Search Hook
 * Gerencia o estado da busca global do sistema
 */

import { useState, useCallback } from 'react'

interface UseGlobalSearchReturn {
  isSearchOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  toggleSearch: () => void
}

export function useGlobalSearch(): UseGlobalSearchReturn {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const openSearch = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
  }, [])

  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => !prev)
  }, [])

  return {
    isSearchOpen,
    openSearch,
    closeSearch,
    toggleSearch
  }
}
