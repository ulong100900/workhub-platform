// components/filters/RegionCityFilter.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { MapPin, Navigation, Target, Globe, X, Check, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { russianCities } from '@/data/russianCities'

interface RegionCityFilterProps {
  selectedCity?: string
  selectedRegion?: string
  radius?: number
  onCityChange: (city: string, region?: string) => void
  onRadiusChange?: (radius: number) => void
  onCurrentLocation?: () => void
  className?: string
}

const popularCitiesLocal = [
  { name: 'Москва', region: 'Москва', icon: '🏛️', featured: true },
  { name: 'Санкт-Петербург', region: 'Санкт-Петербург', icon: '🏰', featured: true },
  { name: 'Новосибирск', region: 'Новосибирская область', icon: '🌉' },
  { name: 'Екатеринбург', region: 'Свердловская область', icon: '🏔️' },
  { name: 'Казань', region: 'Татарстан', icon: '🕌' },
  { name: 'Нижний Новгород', region: 'Нижегородская область', icon: '⛪' },
  { name: 'Челябинск', region: 'Челябинская область', icon: '🏭' },
  { name: 'Краснодар', region: 'Краснодарский край', icon: '☀️' },
  { name: 'Самара', region: 'Самарская область', icon: '🏙️' },
  { name: 'Уфа', region: 'Башкортостан', icon: '🕌' },
]



export default function RegionCityFilter({
  selectedCity = 'Самара',
  selectedRegion = 'Самарская область',
  radius = 10,
  onCityChange,
  onRadiusChange,
  onCurrentLocation,
  className
}: RegionCityFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllRegions, setShowAllRegions] = useState(false)
  const [currentCityOnly, setCurrentCityOnly] = useState(true)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)

  const regions = useMemo(() => {
    if (!russianCities || !Array.isArray(russianCities)) {
      return []
    }
    
    const regionMap = new Map<string, { name: string; cities: string[] }>()
    
    russianCities.forEach(city => {
      if (!regionMap.has(city.region)) {
        regionMap.set(city.region, { name: city.region, cities: [] })
      }
      regionMap.get(city.region)?.cities.push(city.name)
    })
    
    return Array.from(regionMap.entries())
      .map(([_, region]) => region)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const filteredCities = useMemo(() => {
    if (!russianCities || !Array.isArray(russianCities)) {
      return []
    }
    
    if (!searchQuery) {
      return popularCitiesLocal
        .map(popularCity => {
          const cityData = russianCities.find(c => c.name === popularCity.name)
          return cityData || { id: popularCity.name.toLowerCase(), name: popularCity.name, region: popularCity.region }
        })
        .slice(0, showAllRegions ? 50 : 20)
    }
    
    return russianCities
      .filter(city => 
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.region.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 50)
  }, [searchQuery, showAllRegions])

  const handleCitySelect = (cityName: string, regionName: string) => {
    onCityChange(cityName, regionName)
    setSearchQuery('')
  }

  const handleRadiusChange = (value: number[]) => {
    onRadiusChange?.(value[0])
  }

  const handleCurrentLocation = () => {
    setUseCurrentLocation(true)
    onCurrentLocation?.()
  }

  return (
    <div className={cn("flex flex-col h-full max-w-full overflow-hidden", className)}>
      <div className="p-4 pb-3 border-b">
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
            <h3 className="text-lg font-semibold text-gray-900 truncate">Локация</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setShowAllRegions(false)
            }}
            className="h-8 text-gray-500 hover:text-gray-700 shrink-0"
          >
            <X className="h-4 w-4 mr-1" />
            Очистить
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-1 truncate">Выберите город или регион для поиска</p>
      </div>

      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900 truncate">{selectedCity}</div>
                <div className="text-sm text-gray-600 truncate">{selectedRegion}</div>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="px-3 py-1 shrink-0 ml-2">
            Выбрано
          </Badge>
        </div>
      </div>

      <div className="p-4 border-b">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск города или региона..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        <Button
          variant="outline"
          className="w-full mt-3"
          onClick={handleCurrentLocation}
          disabled={useCurrentLocation}
        >
          <Navigation className={cn(
            "h-4 w-4 mr-2 shrink-0",
            useCurrentLocation ? "animate-pulse text-blue-600" : "text-gray-500"
          )} />
          <span className="truncate">
            {useCurrentLocation ? 'Определение...' : 'Моё местоположение'}
          </span>
        </Button>
      </div>

      <div className="p-4 border-b">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 truncate">
          <Star className="h-4 w-4 text-yellow-500 shrink-0" />
          Популярные города
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {popularCitiesLocal.map((city) => (
            <button
              key={city.name}
              onClick={() => handleCitySelect(city.name, city.region)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 min-w-0",
                "hover:border-gray-300 hover:bg-gray-50",
                selectedCity === city.name
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200"
              )}
            >
              <span className="text-lg shrink-0">{city.icon}</span>
              <div className="text-left flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{city.name}</div>
                <div className="text-xs text-gray-500 truncate">{city.region}</div>
              </div>
              {selectedCity === city.name && (
                <Check className="h-4 w-4 text-blue-600 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {searchQuery ? 'Результаты поиска' : 'Все города'}
            </h4>
            {!searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllRegions(!showAllRegions)}
                className="text-xs shrink-0"
              >
                {showAllRegions ? 'Скрыть' : 'Показать все'}
              </Button>
            )}
          </div>
          
          <ScrollArea className="h-[300px]">
            <div className="space-y-1 pr-4">
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCitySelect(city.name, city.region)}
                    className={cn(
                      "flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 transition-colors min-w-0",
                      selectedCity === city.name && "bg-blue-50"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        selectedCity === city.name
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      )}>
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{city.name}</div>
                        <div className="text-xs text-gray-500 truncate">{city.region}</div>
                      </div>
                    </div>
                    {selectedCity === city.name && (
                      <Check className="h-5 w-5 text-blue-600 shrink-0 ml-2" />
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Город не найден</p>
                  <p className="text-sm text-gray-400 mt-1">Попробуйте другой запрос</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="space-y-4">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Globe className="h-4 w-4 text-gray-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 truncate">Поиск в радиусе</div>
                <div className="text-sm text-gray-600 truncate">Расширьте область поиска</div>
              </div>
            </div>
            <div className="text-lg font-bold text-blue-600 shrink-0 pl-2">{radius} км</div>
          </div>
          
          <Slider
            value={[radius]}
            onValueChange={handleRadiusChange}
            max={100}
            min={1}
            step={1}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>1 км</span>
            <span>25 км</span>
            <span>50 км</span>
            <span>75 км</span>
            <span>100 км</span>
          </div>

          <div className="flex items-center justify-between pt-2 min-w-0">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">Только в выбранном городе</div>
              <div className="text-sm text-gray-600 truncate">Не искать в соседних городах</div>
            </div>
            <Switch
              checked={currentCityOnly}
              onCheckedChange={setCurrentCityOnly}
              className="shrink-0 ml-2"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t">
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          <Check className="h-4 w-4 mr-2" />
          Применить локацию
        </Button>
      </div>
    </div>
  )
}