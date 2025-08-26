'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './footer'

export function ConditionalFooter() {
  const pathname = usePathname()
  
  // Don't render footer on admin routes since admin layout manages its own layout
  if (pathname?.startsWith('/admin')) {
    return null
  }
  
  return <Footer />
}