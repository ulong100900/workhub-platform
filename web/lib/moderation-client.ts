// /web/lib/moderation-client.ts
'use client'

import { 
  findSwearWords, 
  getUniqueSwearWords, 
  highlightSwearWords, 
  autoFixSwearWords, 
  containsSwearWords,
  moderateTextAPI
} from './moderation'
import { useState, useCallback } from 'react'

export function useModeration() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  
  const moderate = useCallback(async (text: string) => {
    setIsLoading(true)
    try {
      const result = await moderateTextAPI(text)
      setLastResult(result)
      return result
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  const fixText = useCallback((text: string) => {
    return autoFixSwearWords(text)
  }, [])
  
  const checkText = useCallback((text: string) => {
    return containsSwearWords(text)
  }, [])
  
  return {
    moderate,
    fixText,
    checkText,
    isLoading,
    lastResult,
    findSwearWords,
    getUniqueSwearWords,
    highlightSwearWords
  }
}