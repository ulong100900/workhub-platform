// components/projects/CitySelector.tsx
'use client'

import React, { useState } from 'react'
import { MapPin, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface CitySelectorProps {
  selectedCity: string
  onCityChange: (city: string) => void
}

const cities = [
  { id: 'all', name: 'Все города' },
  { id: 'moscow', name: 'Москва' },
  { id: 'spb', name: 'Санкт-Петербург' },
  { id: 'ekb', name: 'Екатеринбург' },
  { id: 'novosibirsk', name: 'Новосибирск' },
  { id: 'kazan', name: 'Казань' },
  { id: 'n_novgorod', name: 'Нижний Новгород' },
  { id: 'samara', name: 'Самара' },
  { id: 'chelyabinsk', name: 'Челябинск' },
  { id: 'ufa', name: 'Уфа' },
  { id: 'rostov', name: 'Ростов-на-Дону' },
  { id: 'krasnodar', name: 'Краснодар' },
  { id: 'remote', name: 'Удалённая работа' },
]

export default function CitySelector({ selectedCity, onCityChange }: CitySelectorProps) {
  const selectedCityName = cities.find(city => city.id === selectedCity)?.name || 'Все города'

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Город</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full md:w-auto justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{selectedCityName}</span>
            </div>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto">
          {cities.map((city) => (
            <DropdownMenuItem
              key={city.id}
              onClick={() => onCityChange(city.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span>{city.name}</span>
              {selectedCity === city.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}