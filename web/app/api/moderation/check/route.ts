import { NextRequest, NextResponse } from 'next/server'
// ИСПРАВЛЯЕМ ИМПОРТ - используем правильные имена функций
import { 
  findSwearWords, 
  getUniqueSwearWords,
  RUSSIAN_PROFANITY as BAD_WORDS 
} from '@/lib/moderation'

// Адаптер для совместимости со старым кодом
const findBadWordsPositions = (text: string) => {
  const swearWords = findSwearWords(text);
  return swearWords.map(sw => ({
    word: sw.word,
    start: sw.start,
    end: sw.end
  }));
};

const getUniqueBadWords = (text: string) => {
  return getUniqueSwearWords(text);
};

// Кэширование результатов для производительности
const moderationCache = new Map<string, {
  result: any
  timestamp: number
}>()

const CACHE_TTL = 5 * 60 * 1000 // 5 минут

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }
    
    // Проверяем кэш
    const cacheKey = text.trim().toLowerCase()
    const cached = moderationCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.result)
    }
    
    // Находим плохие слова
    const positions = findBadWordsPositions(text)
    const uniqueBadWords = getUniqueBadWords(text)
    
    const result = {
      isClean: positions.length === 0,
      errors: positions.length > 0 ? uniqueBadWords : undefined,
      positions: positions.length > 0 ? positions : undefined,
      suggestions: positions.length > 0 ? [
        'Используйте профессиональную лексику',
        'Избегайте оскорбительных выражений',
        'Будьте уважительны к другим пользователям'
      ] : undefined,
      statistics: {
        totalWords: text.trim().split(/\s+/).length,
        badWordsCount: positions.length,
        uniqueBadWords: uniqueBadWords.length,
        textLength: text.length
      }
    }
    
    // Сохраняем в кэш
    moderationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    })
    
    // Очищаем старый кэш
    if (moderationCache.size > 1000) {
      for (const [key, value] of moderationCache.entries()) {
        if (Date.now() - value.timestamp > CACHE_TTL) {
          moderationCache.delete(key)
        }
      }
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Moderation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}