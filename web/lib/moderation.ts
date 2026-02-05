// /web/lib/moderation.ts
// Фокус только на матерные слова и оскорбления

// ========== ОСНОВНОЙ СПИСОК МАТЕРНЫХ СЛОВ ==========
export const RUSSIAN_PROFANITY = {
  // Основные матерные слова (4 корня)
  CORE_SWEAR: [
    // Хуй и производные
    'хуй', 'хуё', 'хуя', 'хуе', 'хую', 
    'хуев', 'хуёв', 'хуя́', 'хуём', 'ху́й',
    // Пидорас и производные
    'пидор', 'педик', 'пидарас', 'пидр', 'пидар',
    'пидрила', 'пидрило', 'педераст', 'пидорюга',
    // Блядь и производные
    'бля', 'бляд', 'блять', 'блядь', 'блядина',
    'блядский', 'блядство', 'блядун', 'блядунья',
    'бляха', 'бляшки', 'бляхов', 'бляшон',
    // Ебать и производные
    'ебан', 'ебать', 'ебаш', 'ебал', 'ёб',
    'ёбан', 'ёбаный', 'ебаный', 'ёбну', 'ёбн',
    'ебли', 'ебл', 'ёбли', 'ёбля',
    // Варианты с заменой букв
    'xyй', 'xyё', 'xуй', 'xуё', 'пизд', 'пиздё',
    'пизда', 'пизде', 'пизду', 'пизды',
  ],

  // Менее жесткие, но все равно матерные
  MILD_SWEAR: [
    'говн', 'говё', 'гавн', 'дерьм', 'дерьмо',
    'залуп', 'залупа', 'залупе', 'залупу',
    'муд', 'муда', 'муде', 'мудо', 'мудак',
    'мудозвон', 'мудоеб', 'мудил', 'мудень',
    'падл', 'падло', 'падла', 'падле', 'падлу',
    'сучк', 'сука', 'суке', 'суки', 'сучень',
    'сучон', 'сучка', 'сучье', 'сучар',
    'шлюх', 'шлюха', 'шлюхи', 'шлюхе', 'шлюху',
    'уёб', 'уеб', 'уёбищ', 'уебищ', 'ёбтв',
    'жоп', 'жопа', 'жопе', 'жопу', 'жопы',
    'жопн', 'жополиз', 'жопочник',
  ],

  // Комбинированные матерные выражения
  COMBINED_SWEAR: [
    'охуе', 'охуеть', 'охуен', 'охуенно',
    'охуительн', 'охрен', 'охереть', 'охерит',
    'похуй', 'похую', 'похуизм', 'нахуй',
    'нахуя', 'нахер', 'нихуя', 'нихуя́',
    'хуесос', 'хуеплет', 'хуеглот', 'хуемразь',
    'хуйло', 'хуйня', 'хуила', 'хуило',
    'ебанут', 'ёбанут', 'ебонуть', 'ёбонуть',
    'пиздец', 'пиздабол', 'пиздобол', 'пиздюк',
    'пиздюли', 'пиздень', 'пиздош', 'пиздюга',
  ],

  // Иностранные матерные слова (используемые в русском)
  FOREIGN_SWEAR: [
    'fuck', 'fucking', 'fucker', 'motherfucker',
    'shit', 'bitch', 'asshole', 'dick', 'cock',
    'pussy', 'cunt', 'bastard', 'whore', 'slut',
    'douchebag', 'scumbag', 'jerk', 'retard',
  ]
};

// Экспортируем под старым именем для совместимости
export const BAD_WORDS = RUSSIAN_PROFANITY;

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
// Нормализация текста для поиска
export function normalizeTextForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD') // Нормализация Unicode
    .replace(/[\u0300-\u036f]/g, '') // Удаление диакритических знаков
    // Заменяем похожие символы
    .replace(/[ё]/g, 'е')
    .replace(/[й]/g, 'и')
    .replace(/[ъь]/g, '')
    // Заменяем латинские буквы, похожие на кириллицу
    .replace(/[a@]/g, 'а')
    .replace(/[e]/g, 'е')
    .replace(/[o0]/g, 'о')
    .replace(/[c]/g, 'с')
    .replace(/[p]/g, 'р')
    .replace(/[x]/g, 'х')
    .replace(/[y]/g, 'у')
    .replace(/[k]/g, 'к')
    // Удаляем все остальные не-буквы, кроме пробелов
    .replace(/[^а-я\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Генерация вариантов слова (leet speak)
export function generateWordVariants(word: string): string[] {
  const variants = new Set<string>([word]);
  
  // Основные замены
  const replacements: Record<string, string[]> = {
    'а': ['a', '@', '4'],
    'е': ['e', '3', 'ё'],
    'и': ['i', 'u', 'й'],
    'о': ['o', '0'],
    'с': ['c', 's'],
    'у': ['y', 'u'],
    'х': ['x', 'h'],
    'к': ['k'],
    'р': ['p', 'r'],
    'н': ['n', 'h'],
    'т': ['t', '7'],
    'в': ['v', 'b'],
    'з': ['z', '3'],
    'г': ['g'],
    'д': ['d'],
    'л': ['l'],
    'м': ['m'],
    'п': ['p'],
    'ф': ['f'],
    'ч': ['4', 'ch'],
    'ш': ['sh'],
    'щ': ['sch'],
    'ы': ['bi'],
    'э': ['e'],
    'ю': ['yu', 'iu'],
    'я': ['ya', '9'],
  };
  
  // Генерируем базовые варианты
  const chars = word.split('');
  
  // Вариант 1: Замена каждой буквы
  let current = '';
  chars.forEach(char => {
    const charVariants = replacements[char] || [char];
    current += charVariants[0];
  });
  if (current !== word) variants.add(current);
  
  // Вариант 2: Смешанный (каждая 2-я буква)
  current = '';
  chars.forEach((char, index) => {
    if (index % 2 === 0 && replacements[char]) {
      current += replacements[char][0];
    } else {
      current += char;
    }
  });
  if (current !== word) variants.add(current);
  
  // Вариант 3: Только цифры для гласных
  current = '';
  const vowelReplacements: Record<string, string> = {
    'а': '4',
    'е': '3',
    'и': '1',
    'о': '0',
  };
  chars.forEach(char => {
    current += vowelReplacements[char] || char;
  });
  if (current !== word) variants.add(current);
  
  return Array.from(variants);
}

// ========== ОСНОВНЫЕ ФУНКЦИИ МОДЕРАЦИИ ==========
// Поиск матерных слов в тексте
export function findSwearWords(text: string): Array<{
  word: string;
  start: number;
  end: number;
  category: string;
  severity: 'low' | 'medium' | 'high';
}> {
  if (!text || !text.trim()) return [];
  
  const results: Array<{
    word: string;
    start: number;
    end: number;
    category: string;
    severity: 'low' | 'medium' | 'high';
  }> = [];
  
  const lowerText = text.toLowerCase();
  
  // Объединяем ВСЕ матерные слова в один массив для поиска
  const allSwearWords = [
    ...RUSSIAN_PROFANITY.CORE_SWEAR,
    ...RUSSIAN_PROFANITY.MILD_SWEAR,
    ...RUSSIAN_PROFANITY.COMBINED_SWEAR,
    ...RUSSIAN_PROFANITY.FOREIGN_SWEAR
  ];
  
  // Преобразуем в Set для уникальности и сортируем от длинных к коротким
  const uniqueSwearWords = [...new Set(allSwearWords)]
    .filter(word => word.length >= 3) // Только слова от 3 символов
    .sort((a, b) => b.length - a.length);
  
  // Для каждого матерного слова ищем точные совпадения
  for (const swearWord of uniqueSwearWords) {
    const lowerSwear = swearWord.toLowerCase();
    
    // Создаем регулярное выражение для поиска ЦЕЛЫХ слов
    // Используем границы слов: начало строки, пробел или знак препинания
    const regex = new RegExp(`(^|[\\s\\W])(${escapeRegExp(lowerSwear)})([\\s\\W]|$)`, 'gi');
    
    let match;
    while ((match = regex.exec(lowerText)) !== null) {
      const start = match.index + match[1].length;
      const end = start + match[2].length;
      
      // Получаем оригинальное слово из текста
      const originalWord = text.substring(start, end);
      
      // Определяем категорию и важность
      let category = 'OTHER';
      let severity: 'low' | 'medium' | 'high' = 'medium';
      
      if (RUSSIAN_PROFANITY.CORE_SWEAR.includes(swearWord) || 
          RUSSIAN_PROFANITY.COMBINED_SWEAR.includes(swearWord)) {
        category = 'CORE_SWEAR';
        severity = 'high';
      } else if (RUSSIAN_PROFANITY.MILD_SWEAR.includes(swearWord)) {
        category = 'MILD_SWEAR';
        severity = 'medium';
      } else if (RUSSIAN_PROFANITY.FOREIGN_SWEAR.includes(swearWord)) {
        category = 'FOREIGN_SWEAR';
        severity = 'medium';
      }
      
      // Добавляем только если это не ложное срабатывание
      if (!isFalsePositiveSimple(originalWord, swearWord)) {
        results.push({
          word: originalWord,
          start,
          end,
          category,
          severity,
        });
      }
    }
  }
  
  // Убираем дубликаты
  return deduplicateResultsSimple(results);
}

// Простая функция для проверки ложных срабатываний
function isFalsePositiveSimple(foundWord: string, swearWord: string): boolean {
  const lowerFound = foundWord.toLowerCase();
  const lowerSwear = swearWord.toLowerCase();
  
  // Известные безопасные слова, которые могут содержать части матерных
  const safeWords = [
    'соединение', 'эвотор', 'облачный', 'сервис', 'прямой', 'основной',
    'личный', 'кабинет', 'управление', 'номенклатура', 'установка',
    'приложение', 'обмен', 'удаленный', 'доступ'
  ];
  
  // Если найденное слово входит в список безопасных
  if (safeWords.some(safe => lowerFound.includes(safe))) {
    return true;
  }
  
  // Если это короткая часть (менее 4 символов) и не точное совпадение
  if (lowerFound.length < 4 && lowerFound !== lowerSwear) {
    return true;
  }
  
  // Если это одиночная буква
  if (lowerFound.length === 1) {
    return true;
  }
  
  return false;
}

// Простая дедупликация
function deduplicateResultsSimple(results: Array<any>): Array<any> {
  const unique = [];
  const seen = new Set<string>();
  
  for (const result of results) {
    const key = `${result.start}-${result.end}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(result);
    }
  }
  
  return unique;
}

// Проверка текста на наличие мата
export function containsSwearWords(text: string): boolean {
  return findSwearWords(text).length > 0;
}

// Получение уникальных матерных слов
export function getUniqueSwearWords(text: string): string[] {
  const results = findSwearWords(text);
  return [...new Set(results.map(r => r.word.toLowerCase()))];
}

// ========== ФУНКЦИИ ДЛЯ ОБРАБОТКИ ПОЗИЦИЙ ==========
/**
 * Находит позиции матерных слов в тексте (для совместимости со старым кодом)
 */
export function findBadWordsPositions(text: string): Array<{
  word: string;
  start: number;
  end: number;
}> {
  const swearWords = findSwearWords(text);
  
  return swearWords.map(sw => ({
    word: sw.word,
    start: sw.start,
    end: sw.end
  }));
}

/**
 * Получает уникальные матерные слова (для совместимости со старым кодом)
 */
export function getUniqueBadWords(text: string): string[] {
  return getUniqueSwearWords(text);
}

// Подсветка матерных слов в тексте (работает только на клиенте)
export function highlightSwearWords(text: string): {
  html: string;
  hasSwearWords: boolean;
  swearCount: number;
} {
  const results = findSwearWords(text);
  
  if (results.length === 0) {
    return {
      html: text.replace(/\n/g, '<br>'),
      hasSwearWords: false,
      swearCount: 0
    };
  }
  
  let highlighted = '';
  let lastIndex = 0;
  
  for (const result of results.sort((a, b) => a.start - b.start)) {
    // Текст до матерного слова
    highlighted += text.substring(lastIndex, result.start)
      .replace(/\n/g, '<br>');
    
    // Подсвеченное матерное слово
    const severityClass = result.severity === 'high' ? 'swear-high' :
                         result.severity === 'medium' ? 'swear-medium' : 'swear-low';
    
    highlighted += `<span class="swear-word ${severityClass}" ` +
                   `data-word="${escapeHtmlServer(result.word)}" ` +
                   `data-category="${result.category}" ` +
                   `title="Обнаружен ${result.severity === 'high' ? 'грубый' : 'мягкий'} мат">` +
                   `${escapeHtmlServer(text.substring(result.start, result.end))}</span>`;
    
    lastIndex = result.end;
  }
  
  // Остаток текста после последнего матерного слова
  highlighted += text.substring(lastIndex).replace(/\n/g, '<br>');
  
  return {
    html: highlighted,
    hasSwearWords: true,
    swearCount: results.length
  };
}

// Основная функция модерации
export async function moderateTextAPI(text: string): Promise<{
  isClean: boolean;
  errors?: string[];
  positions?: Array<{word: string, start: number, end: number}>;
  statistics?: {
    totalWords: number;
    swearWordsCount: number;
    swearWordsFound: Array<{word: string, category: string, severity: string}>;
    uniqueSwearWords: number;
    textLength: number;
  };
}> {
  if (!text || text.trim().length === 0) {
    return {
      isClean: true,
      statistics: {
        totalWords: 0,
        swearWordsCount: 0,
        swearWordsFound: [],
        uniqueSwearWords: 0,
        textLength: 0
      }
    };
  }
  
  try {
    const swearWords = findSwearWords(text);
    const uniqueSwearWords = getUniqueSwearWords(text);
    const wordCount = text.trim().split(/\s+/).length;
    
    const result = {
      isClean: swearWords.length === 0,
      ...(swearWords.length > 0 && {
        errors: uniqueSwearWords,
        positions: swearWords.map(({ word, start, end }) => ({ word, start, end }))
      }),
      statistics: {
        totalWords: wordCount,
        swearWordsCount: swearWords.length,
        swearWordsFound: swearWords.map(sw => ({
          word: sw.word,
          category: sw.category,
          severity: sw.severity
        })),
        uniqueSwearWords: uniqueSwearWords.length,
        textLength: text.length
      }
    };
    
    return result;
    
  } catch (error) {
    console.error('Moderation error:', error);
    
    // В случае ошибки считаем текст чистым (безопасный подход)
    return {
      isClean: true,
      statistics: {
        totalWords: text.trim().split(/\s+/).length,
        swearWordsCount: 0,
        swearWordsFound: [],
        uniqueSwearWords: 0,
        textLength: text.length
      }
    };
  }
}

// Автоматическое исправление текста
export function autoFixSwearWords(text: string): string {
  const results = findSwearWords(text);
  if (results.length === 0) return text;
  
  let fixedText = text;
  // Заменяем с конца, чтобы не сбивать индексы
  for (const result of results.sort((a, b) => b.start - a.start)) {
    const original = fixedText.substring(result.start, result.end);
    const replacement = '*'.repeat(original.length);
    fixedText = fixedText.substring(0, result.start) + replacement + fixedText.substring(result.end);
  }
  
  return fixedText;
}

// Вспомогательные функции (работают на сервере)
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtmlServer(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (m) => map[m]);
}

// CSS классы для подсветки (добавьте в ваш CSS)
/*
.swear-word {
  position: relative;
  cursor: help;
}

.swear-high {
  background-color: #fee2e2;
  border-bottom: 2px solid #dc2626;
  padding: 0 2px;
  border-radius: 2px;
}

.swear-medium {
  background-color: #fef3c7;
  border-bottom: 2px solid #d97706;
  padding: 0 2px;
  border-radius: 2px;
}

.swear-low {
  background-color: #dbeafe;
  border-bottom: 2px solid #2563eb;
  padding: 0 2px;
  border-radius: 2px;
}

.swear-word:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 1000;
}
*/