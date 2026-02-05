// components/projects/FiltersSidebar.tsx
'use client'

import React, { useState } from 'react'
import { X, Filter, LayoutGrid, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CategorySelector from './CategorySelector'
import RegionCityFilter from '../filters/RegionCityFilter'
import { cn } from '@/lib/utils'

interface FiltersSidebarProps {
  isOpen: boolean
  onClose: () => void
  selectedCategory: string
  selectedCity: string
  selectedRegion: string
  onCategoryChange: (category: string) => void
  onLocationChange: (city: string, region?: string) => void
  onRadiusChange?: (radius: number) => void
  isMobile?: boolean
}

export default function FiltersSidebar({
  isOpen,
  onClose,
  selectedCategory,
  selectedCity,
  selectedRegion,
  onCategoryChange,
  onLocationChange,
  onRadiusChange,
  isMobile = false
}: FiltersSidebarProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'location'>('categories')

  if (isMobile) {
    if (!isOpen) return null

    return (
      <>
        <div 
          className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-300"
          onClick={onClose}
        />
        
        <div className="fixed bottom-0 left-0 right-0 z-50 h-[85vh] bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="sticky top-0 z-10 bg-white border-b rounded-t-2xl">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-3">
                <Filter className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Фильтры</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <Tabs 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as any)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                <TabsTrigger value="categories" className="py-3">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Категории
                </TabsTrigger>
                <TabsTrigger value="location" className="py-3">
                  <MapPin className="h-4 w-4 mr-2" />
                  Локация
                </TabsTrigger>
              </TabsList>

              <TabsContent value="categories" className="mt-0 h-[calc(85vh-140px)]">
                <CategorySelector
                  selectedCategory={selectedCategory}
                  onCategoryChange={(cat) => {
                    onCategoryChange(cat)
                    setActiveTab('location')
                  }}
                  maxHeight="h-[calc(85vh-180px)]"
                />
              </TabsContent>

              <TabsContent value="location" className="mt-0 h-[calc(85vh-140px)]">
                <div className="h-full">
                  <RegionCityFilter
                    selectedCity={selectedCity}
                    selectedRegion={selectedRegion}
                    onCityChange={(city, region) => {
                      onLocationChange(city, region)
                    }}
                    onRadiusChange={onRadiusChange}
                    onCurrentLocation={handleCurrentLocation}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Применить фильтры
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  const handleCurrentLocation = () => {
    // Логика определения местоположения
  }

  return (
    <div className="sticky top-4 flex flex-col lg:flex-row gap-4 lg:gap-6">
      <div className="w-full lg:w-96 h-fit rounded-xl border border-gray-200 bg-white shadow-sm">
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
        />
      </div>

      <div className="w-full lg:w-80 h-fit rounded-xl border border-gray-200 bg-white shadow-sm">
        <RegionCityFilter
          selectedCity={selectedCity}
          selectedRegion={selectedRegion}
          onCityChange={onLocationChange}
          onRadiusChange={onRadiusChange}
          onCurrentLocation={handleCurrentLocation}
        />
      </div>
    </div>
  )
}