'use client'

import { sanitizeHTML } from '@/lib/security/xss'

interface SafeHTMLProps {
  html: string
  className?: string
}

export default function SafeHTML({ html, className }: SafeHTMLProps) {
  const cleanHTML = sanitizeHTML(html)
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHTML }}
    />
  )
}