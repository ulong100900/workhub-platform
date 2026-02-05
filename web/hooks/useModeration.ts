import { useState, useCallback, useRef } from 'react';

interface ModerationResult {
  isClean: boolean;
  errors?: string[];
  score?: number;
  categories?: string[];
  sanitizedText?: string;
  violations?: Array<{
    word: string;
    category: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface UseModerationOptions {
  endpoint?: string;
  autoCheck?: boolean;
  debounceMs?: number;
  fallbackToClient?: boolean;
  showWarnings?: boolean;
}

export function useModeration(options?: UseModerationOptions) {
  const {
    endpoint = '/api/moderation/check',
    autoCheck = true,
    debounceMs = 500,
    fallbackToClient = true,
    showWarnings = false,
  } = options || {};

  const [isModerating, setIsModerating] = useState(false);
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);
  const [lastCheckedText, setLastCheckedText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Простая клиентская проверка для фолбэка
  const clientModerate = useCallback((text: string): ModerationResult => {
    const BAD_WORDS = [
      // Основные матерные слова (можно вынести в отдельный файл)
      'хуй', 'хуё', 'хуя', 'пизд', 'еба', 'ёб', 'бля', 'блять', 'блядь',
      'охуе', 'ахуе', 'пидор', 'педик', 'гомик', 'сучк', 'мудак', 'долбоёб',
      'уебан', 'залуп', 'гандон', 'шлюх',
    ];

    const lowerText = text.toLowerCase();
    const foundWords = BAD_WORDS.filter(word => lowerText.includes(word));

    return {
      isClean: foundWords.length === 0,
      errors: foundWords.length > 0 ? foundWords : undefined,
      score: foundWords.length * 10,
      categories: foundWords.length > 0 ? ['OBSCENE'] : [],
    };
  }, []);

  // Основная функция проверки
  const checkText = useCallback(async (
    text: string,
    checkOptions?: {
      strict?: boolean;
      mask?: boolean;
      returnStats?: boolean;
    }
  ) => {
    if (!text.trim()) {
      const result: ModerationResult = { isClean: true };
      setModerationResult(result);
      setError(null);
      return { isClean: true, result };
    }

    // Отменяем предыдущий запрос, если он еще выполняется
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsModerating(true);
    setError(null);
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Можно добавить заголовки для аналитики
          'X-Client-Version': '1.0.0',
        },
        body: JSON.stringify({ 
          text,
          options: checkOptions,
          timestamp: new Date().toISOString(),
        }),
        signal: abortController.signal,
        // Таймаут через Promise.race
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ModerationResult = await response.json();
      
      setModerationResult(result);
      setLastCheckedText(text);
      
      // Показываем предупреждение в консоли в dev режиме
      if (showWarnings && !result.isClean && process.env.NODE_ENV === 'development') {
        console.warn('Moderation violations found:', {
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          violations: result.violations,
          score: result.score,
        });
      }

      return { isClean: result.isClean, result };

    } catch (error: any) {
      // Если запрос был отменен, не обрабатываем как ошибку
      if (error.name === 'AbortError') {
        return { isClean: true, result: null };
      }

      console.error('Moderation check failed:', error);
      setError(error.message || 'Moderation service unavailable');

      // Фолбэк на клиентскую проверку
      if (fallbackToClient) {
        const fallbackResult = clientModerate(text);
        setModerationResult(fallbackResult);
        return { isClean: fallbackResult.isClean, result: fallbackResult };
      }

      // В случае ошибки без фолбэка считаем текст чистым
      const errorResult: ModerationResult = { isClean: true };
      setModerationResult(errorResult);
      return { isClean: true, result: errorResult };

    } finally {
      setIsModerating(false);
      abortControllerRef.current = undefined;
    }
  }, [endpoint, fallbackToClient, clientModerate, showWarnings]);

  // Дебаунсированная проверка (для инпутов в реальном времени)
  const checkTextDebounced = useCallback((
    text: string,
    options?: {
      onResult?: (result: { isClean: boolean; result: ModerationResult | null }) => void;
      immediate?: boolean;
    }
  ) => {
    // Очищаем предыдущий таймер
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Немедленная проверка для коротких текстов или если указано
    if (text.length < 3 || options?.immediate) {
      checkText(text).then(options?.onResult);
      return;
    }

    // Дебаунсированная проверка
    debounceTimerRef.current = setTimeout(async () => {
      const result = await checkText(text);
      options?.onResult?.(result);
    }, debounceMs);
  }, [checkText, debounceMs]);

  // Проверка формы перед отправкой
  const validateForm = useCallback(async (
    formData: Record<string, any>,
    fieldsToCheck: string[] = ['content', 'message', 'text', 'comment', 'description']
  ) => {
    const errors: Record<string, string> = {};
    let isValid = true;

    for (const field of fieldsToCheck) {
      const value = formData[field];
      if (typeof value === 'string' && value.trim()) {
        const { isClean, result } = await checkText(value, { strict: true });
        
        if (!isClean) {
          isValid = false;
          errors[field] = result?.errors?.join(', ') || 'Content violates moderation rules';
          
          // Можно предложить исправленный текст
          if (result?.sanitizedText) {
            errors[`${field}Suggested`] = result.sanitizedText;
          }
        }
      }
    }

    return { isValid, errors };
  }, [checkText]);

  // Сброс состояния
  const resetModeration = useCallback(() => {
    setModerationResult(null);
    setError(null);
    setLastCheckedText('');
    
    // Отменяем текущий запрос
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Очищаем таймер
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Эффект для очистки при размонтировании
  React.useEffect(() => {
    return () => {
      resetModeration();
    };
  }, [resetModeration]);

  return {
    // Состояние
    isModerating,
    moderationResult,
    error,
    lastCheckedText,
    
    // Методы
    checkText,
    checkTextDebounced,
    validateForm,
    resetModeration,
    
    // Утилиты
    hasViolations: moderationResult ? !moderationResult.isClean : false,
    violationCount: moderationResult?.errors?.length || 0,
    violationScore: moderationResult?.score || 0,
    getSanitizedText: () => moderationResult?.sanitizedText || lastCheckedText,
  };
}

// Пример использования компонента с модерацией
interface ContentInputProps {
  onContentChange?: (content: string, isClean: boolean) => void;
  initialValue?: string;
}

export function ContentInputWithModeration({ 
  onContentChange, 
  initialValue = '' 
}: ContentInputProps) {
  const [content, setContent] = useState(initialValue);
  const [localError, setLocalError] = useState('');
  
  const {
    checkTextDebounced,
    isModerating,
    hasViolations,
    moderationResult,
    getSanitizedText,
  } = useModeration({
    debounceMs: 800,
    showWarnings: true,
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setLocalError('');

    // Проверка в реальном времени с дебаунсом
    if (newContent.trim().length > 2) {
      checkTextDebounced(newContent, {
        onResult: ({ isClean }) => {
          if (!isClean) {
            setLocalError('Текст содержит недопустимые слова');
          }
          onContentChange?.(newContent, isClean);
        }
      });
    }
  }, [checkTextDebounced, onContentChange]);

  const handleBlur = useCallback(() => {
    if (content.trim() && hasViolations) {
      // Предлагаем исправленный текст при потере фокуса
      const sanitized = getSanitizedText();
      if (sanitized && sanitized !== content) {
        if (window.confirm('Обнаружены нарушения. Исправить автоматически?')) {
          setContent(sanitized);
          onContentChange?.(sanitized, true);
          setLocalError('');
        }
      }
    }
  }, [content, hasViolations, getSanitizedText, onContentChange]);

  return (
    <div className="content-input">
      <textarea
        value={content}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Введите текст..."
        className={localError ? 'error' : ''}
        disabled={isModerating}
      />
      
      {isModerating && (
        <div className="moderation-loading">
          Проверка текста...
        </div>
      )}
      
      {localError && (
        <div className="moderation-error">
          ⚠️ {localError}
          {moderationResult?.errors && (
            <small>Нарушения: {moderationResult.errors.join(', ')}</small>
          )}
        </div>
      )}
      
      {hasViolations && !localError && (
        <div className="moderation-warning">
          ⚠️ Текст содержит нежелательные слова
        </div>
      )}
    </div>
  );
}

// Хук для проверки перед отправкой формы
export function useModerationForm() {
  const { validateForm, isModerating } = useModeration();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSubmit = useCallback(async (
    formData: Record<string, any>,
    onSubmit: (data: Record<string, any>) => void,
    fieldsToCheck?: string[]
  ) => {
    const { isValid, errors } = await validateForm(formData, fieldsToCheck);
    
    setFormErrors(errors);
    
    if (isValid) {
      onSubmit(formData);
    } else {
      // Можно показать уведомление или сфокуситься на первом поле с ошибкой
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          (element as HTMLElement).focus();
        }
      }
    }
    
    return isValid;
  }, [validateForm]);

  return {
    handleSubmit,
    formErrors,
    isModerating,
    clearErrors: () => setFormErrors({}),
  };
}