// components/projects/CategoryDropdown.tsx
'use client'

import React, { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Subcategory {
  id: string
  name: string
  items: string[]
}

interface Category {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  subcategories: Subcategory[]
}

interface CategoryDropdownProps {
  categories: Category[]
  isOpen: boolean
  onClose: () => void
  onCategorySelect: (categoryId: string) => void
  className?: string
}

export default function CategoryDropdown({
  categories,
  isOpen,
  onClose,
  onCategorySelect,
  className
}: CategoryDropdownProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [hoveredSubcategory, setHoveredSubcategory] = useState<string | null>(null)

  if (!isOpen) return null

  return (
    <div className={cn(
      "absolute top-full left-0 mt-1 w-[800px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex max-h-[500px]",
      className
    )}>
      {/* Левая колонка - основные категории */}
      <div className="w-48 border-r overflow-y-auto">
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Все категории</h3>
        </div>
        <div className="py-1">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onMouseEnter={() => setHoveredCategory(category.id)}
                className={cn(
                  "flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50",
                  hoveredCategory === category.id && "bg-gray-50"
                )}
                onClick={() => {
                  onCategorySelect(category.id)
                  onClose()
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-gray-500" />
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Центральная колонка - подкатегории */}
      {hoveredCategory && (
        <div className="w-64 border-r overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {categories.find(c => c.id === hoveredCategory)?.name}
            </h3>
          </div>
          <div className="py-1">
            {categories
              .find(c => c.id === hoveredCategory)
              ?.subcategories.map((subcategory) => (
                <button
                  key={subcategory.id}
                  onMouseEnter={() => setHoveredSubcategory(subcategory.id)}
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50",
                    hoveredSubcategory === subcategory.id && "bg-gray-50"
                  )}
                >
                  <span className="font-medium text-gray-900">{subcategory.name}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Правая колонка - элементы подкатегории */}
      {hoveredSubcategory && hoveredCategory && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {categories
                .find(c => c.id === hoveredCategory)
                ?.subcategories.find(s => s.id === hoveredSubcategory)?.name}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 p-4">
            {categories
              .find(c => c.id === hoveredCategory)
              ?.subcategories.find(s => s.id === hoveredSubcategory)
              ?.items.map((item, index) => (
                <button
                  key={index}
                  className="text-left p-2 hover:bg-gray-50 rounded text-sm text-gray-700"
                  onClick={() => {
                    console.log('Selected:', item)
                    onCategorySelect(hoveredCategory)
                    onClose()
                  }}
                >
                  {item}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}