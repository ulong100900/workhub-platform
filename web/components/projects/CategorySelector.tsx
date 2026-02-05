// components/projects/CategorySelector.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { mainCategories, getCategoryById } from '@/data/categories'

interface CategorySelectorProps {
  selectedCategory: string
  selectedSubcategory?: string
  onCategoryChange: (categoryId: string, subcategory?: string) => void
  className?: string
}

export default function CategorySelector({ 
  selectedCategory = 'all',
  selectedSubcategory,
  onCategoryChange,
  className
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHoveredCategory(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setHoveredCategory(null)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const currentCategory = getCategoryById(selectedCategory)
  
  const filteredCategories = searchQuery
    ? mainCategories.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.subcategories.some(sub => 
          sub.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : mainCategories

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId)
    if (categoryId === 'all' || !mainCategories.find(c => c.id === categoryId)?.subcategories.length) {
      setIsOpen(false)
      setHoveredCategory(null)
    }
  }

  const handleSubcategorySelect = (categoryId: string, subcategory: string) => {
    onCategoryChange(categoryId, subcategory)
    setIsOpen(false)
    setHoveredCategory(null)
  }

  const displayText = () => {
    if (selectedCategory === 'all') return 'Все категории'
    if (selectedSubcategory) return selectedSubcategory
    return currentCategory?.name || 'Все категории'
  }

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Кнопка триггер */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all",
          "bg-white hover:bg-gray-50 min-w-[180px]",
          isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300"
        )}
      >
        {currentCategory && selectedCategory !== 'all' && (
          <span className={cn("p-1 rounded", currentCategory.color)}>
            {currentCategory.icon}
          </span>
        )}
        <span className="font-medium text-gray-900 truncate flex-1 text-left">
          {displayText()}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-500 transition-transform flex-shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden min-w-[320px]">
          {/* Поиск */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск категории..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          <div className="flex max-h-[400px]">
            {/* Левая колонка - категории */}
            <div className="w-64 border-r overflow-y-auto">
              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors",
                    "hover:bg-gray-50",
                    selectedCategory === category.id && "bg-blue-50",
                    hoveredCategory === category.id && "bg-gray-50"
                  )}
                >
                  <span className={cn("p-1.5 rounded-lg flex-shrink-0", category.color)}>
                    {category.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {category.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {category.count} предложений
                    </div>
                  </div>
                  {category.subcategories.length > 0 && (
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>
              ))}

              {filteredCategories.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Ничего не найдено
                </div>
              )}
            </div>

            {/* Правая колонка - подкатегории */}
            {hoveredCategory && hoveredCategory !== 'all' && (
              <div className="w-56 overflow-y-auto bg-gray-50">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Подкатегории
                  </div>
                  {mainCategories
                    .find(c => c.id === hoveredCategory)
                    ?.subcategories.map((subcat, index) => (
                      <button
                        key={index}
                        onClick={() => handleSubcategorySelect(hoveredCategory, subcat)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm rounded-lg transition-colors",
                          "hover:bg-white hover:shadow-sm",
                          selectedSubcategory === subcat && "bg-white shadow-sm text-blue-600"
                        )}
                      >
                        {subcat}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Футер */}
          <div className="p-3 border-t bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {mainCategories.length} категорий
            </span>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => {
                  onCategoryChange('all')
                  setIsOpen(false)
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Сбросить
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
