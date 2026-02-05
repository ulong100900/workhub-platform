'use client'

import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // Получение из localStorage
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Ошибка чтения localStorage ключа "${key}":`, error)
      return initialValue
    }
  }

  const [storedValue, setStoredValue] = useState<T>(readValue)

  // Функция установки значения
  const setValue = (value: T) => {
    if (typeof window === 'undefined') {
      console.warn(`localStorage недоступен в текущей среде`)
      return
    }

    try {
      // Разрешаем значение быть функцией
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Сохраняем в state
      setStoredValue(valueToStore)
      
      // Сохраняем в localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.warn(`Ошибка установки localStorage ключа "${key}":`, error)
    }
  }

  // Синхронизация между вкладками
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const newValue = JSON.parse(e.newValue)
          setStoredValue(newValue)
        } catch (error) {
          console.warn(`Ошибка синхронизации localStorage ключа "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue]
}