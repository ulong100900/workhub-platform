'use client'

import { useState, useEffect } from 'react'
import { highlightBadWords } from '@/lib/moderation'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TextWithHighlightsProps {
  text: string
  className?: string
  editable?: boolean
  onTextChange?: (text: string) => void
  showControls?: boolean
  onFixWord?: (word: string, index: number) => void
}

export default function TextWithHighlights({
  text,
  className,
  editable = false,
  onTextChange,
  showControls = true,
  onFixWord
}: TextWithHighlightsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(text)
  const [showWordMenu, setShowWordMenu] = useState<{word: string, index: number, x: number, y: number} | null>(null)
  
  const { html, hasBadWords } = highlightBadWords(text)
  
  useEffect(() => {
    setEditedText(text)
  }, [text])
  
  const handleTextClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('bad-word-highlight')) {
      const word = target.dataset.word || ''
      const index = parseInt(target.dataset.index || '0')
      const rect = target.getBoundingClientRect()
      
      setShowWordMenu({
        word,
        index,
        x: rect.left,
        y: rect.bottom + 5
      })
    } else {
      setShowWordMenu(null)
    }
  }
  
  const handleFixWord = (word: string, index: number) => {
    if (onFixWord) {
      onFixWord(word, index)
    }
    setShowWordMenu(null)
  }
  
  const handleSave = () => {
    if (onTextChange) {
      onTextChange(editedText)
    }
    setIsEditing(false)
  }
  
  const handleCancel = () => {
    setEditedText(text)
    setIsEditing(false)
    setShowWordMenu(null)
  }
  
  if (isEditing) {
    return (
      <div className="space-y-3">
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className={cn(
            "w-full min-h-[200px] p-3 border rounded-lg resize-y",
            className
          )}
          placeholder="Введите текст..."
        />
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm">
            Сохранить
          </Button>
          <Button onClick={handleCancel} variant="outline" size="sm">
            Отмена
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="relative">
      <div
        onClick={handleTextClick}
        className={cn(
          "prose prose-gray max-w-none whitespace-pre-wrap",
          "p-3 border rounded-lg min-h-[200px] cursor-text",
          hasBadWords && "border-red-200 bg-red-50",
          className
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      
      {showControls && hasBadWords && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-2 p-2 bg-red-100 text-red-800 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Обнаружены недопустимые слова
            </span>
          </div>
        </div>
      )}
      
      {showControls && !hasBadWords && text.length > 0 && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-2 p-2 bg-green-100 text-green-800 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Текст прошел проверку
            </span>
          </div>
        </div>
      )}
      
      {editable && showControls && (
        <div className="absolute bottom-3 right-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Редактировать текст
          </Button>
        </div>
      )}
      
      {/* Меню для исправления слова */}
      {showWordMenu && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowWordMenu(null)}
          />
          <div
            className="fixed z-50 bg-white border rounded-lg shadow-lg p-2 min-w-[200px]"
            style={{
              left: `${showWordMenu.x}px`,
              top: `${showWordMenu.y}px`
            }}
          >
            <div className="mb-2">
              <div className="text-xs text-gray-500 mb-1">Неприемлемое слово:</div>
              <div className="font-medium text-red-600">{showWordMenu.word}</div>
            </div>
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleFixWord(showWordMenu!.word, showWordMenu!.index)}
              >
                Исправить автоматически
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsEditing(true)}
              >
                Редактировать вручную
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-500"
                onClick={() => setShowWordMenu(null)}
              >
                <X className="h-3 w-3 mr-2" />
                Закрыть
              </Button>
            </div>
          </div>
        </>
      )}
      
      {/* Стили для подсветки */}
      <style jsx global>{`
        .bad-word-highlight {
          position: relative;
          background-color: #fee2e2;
          color: #dc2626;
          padding: 0 2px;
          border-radius: 2px;
          cursor: pointer;
          text-decoration: underline wavy #dc2626;
          text-underline-offset: 3px;
          transition: background-color 0.2s;
        }
        
        .bad-word-highlight:hover {
          background-color: #fecaca;
        }
        
        .bad-word-highlight::after {
          content: '⚠';
          font-size: 0.8em;
          margin-left: 2px;
          opacity: 0.8;
        }
      `}</style>
    </div>
  )
}