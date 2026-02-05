// components/ui/CitySelect.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronsUpDown, MapPin, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

// Здесь импортируем данные городов и регионов
import { russianCities, regions, type Region, type City } from '@/data/russianCities'

interface CitySelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function CitySelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Выберите город"
}: CitySelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filteredResults, setFilteredResults] = useState<{
    regions: Region[]
    cities: City[]
  }>({ regions: [], cities: [] })
  const searchRef = useRef<HTMLInputElement>(null)
  
  // Все города (кроме Москвы, СПб, Севастополя, которые являются регионами)
  const allCities = russianCities.filter(city => city.regionId !== undefined)
  
  // Города-регионы (Москва, СПб, Севастополь)
  const cityRegions = regions.filter(region => !region.hasCities)
  
  // Получаем полное название выбранного города/региона
  const getSelectedName = () => {
    if (!value) return ''
    
    // Сначала проверяем регионы-города
    const cityRegion = cityRegions.find(region => region.id === value)
    if (cityRegion) return cityRegion.name
    
    // Потом проверяем обычные города
    const city = allCities.find(city => city.id === value)
    if (city) return city.name
    
    return ''
  }

  // Эффект для фильтрации при изменении поиска
  useEffect(() => {
    const searchLower = search.toLowerCase()
    
    if (searchLower.length < 2) {
      setFilteredResults({ regions: [], cities: [] })
      return
    }
    
    // Фильтруем регионы
    const filteredRegions = regions.filter(region =>
      region.name.toLowerCase().includes(searchLower)
    )
    
    // Фильтруем города
    const filteredCities = allCities.filter(city =>
      city.name.toLowerCase().includes(searchLower)
    )
    
    setFilteredResults({
      regions: filteredRegions,
      cities: filteredCities
    })
  }, [search, allCities])

  const selectedName = getSelectedName()
  const hasResults = search.length >= 2 && 
    (filteredResults.regions.length > 0 || filteredResults.cities.length > 0)

  // Фокусируемся на поле поиска при открытии
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => {
        searchRef.current?.focus()
      }, 100)
    }
  }, [open])

  const handleSelect = (id: string) => {
    onChange(id)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 font-normal"
          disabled={disabled}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <MapPin className="h-4 w-4 flex-shrink-0 text-gray-500" />
            <span className={cn("truncate", !value && "text-gray-500")}>
              {selectedName || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              ref={searchRef}
              placeholder="Введите название города или региона..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Введите хотя бы 2 символа для поиска
          </p>
        </div>
        
        <ScrollArea className="h-[300px]">
          {search.length < 2 && (
            <div className="py-10 text-center text-sm text-gray-500">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Введите название города или региона</p>
              <p className="text-xs mt-1">Начните вводить для поиска</p>
            </div>
          )}

          {search.length >= 2 && !hasResults && (
            <div className="py-10 text-center text-sm text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Ничего не найдено</p>
              <p className="text-xs mt-1">Попробуйте другой запрос</p>
            </div>
          )}

          {hasResults && (
            <div className="p-2">
              {/* Регионы */}
              {filteredResults.regions.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-medium text-gray-500 px-2 py-2">
                    Регионы
                  </h3>
                  <div className="space-y-1">
                    {filteredResults.regions.map((region) => (
                      <button
                        key={region.id}
                        onClick={() => handleSelect(region.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-left",
                          value === region.id && "bg-blue-50 hover:bg-blue-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{region.name}</span>
                        </div>
                        {value === region.id && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Города */}
              {filteredResults.cities.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 px-2 py-2">
                    Города
                  </h3>
                  <div className="space-y-1">
                    {filteredResults.cities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => handleSelect(city.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-left",
                          value === city.id && "bg-blue-50 hover:bg-blue-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{city.name}</span>
                        </div>
                        {value === city.id && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}