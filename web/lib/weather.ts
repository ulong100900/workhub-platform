// lib/weather.ts
export const getWeatherIcon = (iconCode: string): string => {
  const iconMap: Record<string, string> = {
    '01d': '☀️',
    '01n': '🌙',
    '02d': '⛅',
    '02n': '⛅',
    '03d': '☁️',
    '03n': '☁️',
    '04d': '☁️',
    '04n': '☁️',
    '09d': '🌧️',
    '09n': '🌧️',
    '10d': '🌦️',
    '10n': '🌦️',
    '11d': '⛈️',
    '11n': '⛈️',
    '13d': '❄️',
    '13n': '❄️',
    '50d': '🌫️',
    '50n': '🌫️',
  }
  return iconMap[iconCode] || '☀️'
}

export const fetchWeatherData = async (city: string) => {
  try {
    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
    
    if (!API_KEY) {
      throw new Error('API key not found')
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=ru&appid=${API_KEY}`
    )
    
    if (!response.ok) {
      throw new Error('Ошибка получения погоды')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching weather:', error)
    throw error
  }
}