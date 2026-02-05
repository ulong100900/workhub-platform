'use client'

import Script from 'next/script'

interface StructuredDataProps {
  type: string
  data: any
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  }

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  )
}

// Для главной страницы (основной сайт)
export function WebsiteStructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workfinder.ru'
  
  return (
    <StructuredData
      type="WebSite"
      data={{
        name: 'WorkFinder - Фриланс-биржа',
        url: siteUrl,
        description: 'Платформа для поиска фрилансеров и заказчиков. Найдите исполнителя для вашего проекта или новые заказы для ваших услуг.',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
        inLanguage: 'ru-RU',
      }}
    />
  )
}

// Для страницы проекта
interface ProjectStructuredDataProps {
  project: {
    id: string
    title: string
    description: string
    budget: number
    budget_type?: string
    status: string
    location_city?: string
    is_remote?: boolean
    category: string
    created_at: string
    updated_at?: string
    user?: {
      full_name: string
      id: string
    }
    rating?: number
    review_count?: number
  }
}

export function ProjectStructuredData({ project }: ProjectStructuredDataProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workfinder.ru'
  const projectUrl = `${siteUrl}/projects/${project.id}`
  
  // Определяем тип в зависимости от бюджета
  const offerType = project.budget_type === 'price_request' ? 'Demand' : 'Offer'
  
  // Форматируем описание (убираем HTML теги если есть)
  const cleanDescription = project.description
    ? project.description.replace(/<[^>]*>/g, '').substring(0, 300)
    : ''
  
  // Формируем данные о местоположении
  let areaServed = null
  if (project.is_remote) {
    areaServed = {
      '@type': 'Country',
      name: 'Россия',
      description: 'Удаленная работа',
    }
  } else if (project.location_city) {
    areaServed = {
      '@type': 'City',
      name: project.location_city,
      addressCountry: 'RU',
    }
  }
  
  // Статус проекта
  const availability = project.status === 'published' 
    ? 'https://schema.org/InStock' 
    : 'https://schema.org/OutOfStock'
  
  const structuredData = {
    '@type': 'Service',
    name: project.title,
    description: cleanDescription,
    url: projectUrl,
    provider: {
      '@type': 'Person',
      name: project.user?.full_name || 'Заказчик',
      url: project.user?.id ? `${siteUrl}/profile/${project.user.id}` : undefined,
    },
    serviceType: project.category,
    areaServed,
    isAccessibleForFree: false,
    ...(project.rating && project.review_count && project.review_count > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: project.rating,
        ratingCount: project.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
    offers: {
      '@type': offerType,
      price: project.budget_type === 'price_request' ? 0 : project.budget,
      priceCurrency: 'RUB',
      priceSpecification: {
        '@type': 'PriceSpecification',
        price: project.budget_type === 'price_request' ? 0 : project.budget,
        priceCurrency: 'RUB',
        valueAddedTaxIncluded: true,
      },
      availability,
      validFrom: project.created_at,
      ...(project.updated_at && {
        validThrough: project.updated_at,
      }),
    },
  }
  
  return <StructuredData type="Service" data={structuredData} />
}

// Для профиля фрилансера
interface FreelancerStructuredDataProps {
  freelancer: {
    id: string
    full_name: string
    bio?: string
    rating?: number
    completed_projects?: number
    category?: string
    skills?: string[]
    hourly_rate?: number
    created_at: string
  }
}

export function FreelancerStructuredData({ freelancer }: FreelancerStructuredDataProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workfinder.ru'
  const profileUrl = `${siteUrl}/profile/${freelancer.id}`
  
  const structuredData = {
    '@type': 'Person',
    '@id': profileUrl,
    name: freelancer.full_name,
    description: freelancer.bio || `Фрилансер ${freelancer.full_name}`,
    url: profileUrl,
    knowsAbout: freelancer.skills || [],
    ...(freelancer.category && {
      jobTitle: freelancer.category,
    }),
    ...(freelancer.hourly_rate && {
      makesOffer: {
        '@type': 'Offer',
        price: freelancer.hourly_rate,
        priceCurrency: 'RUB',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          priceType: 'https://schema.org/ListPrice',
          price: freelancer.hourly_rate,
          priceCurrency: 'RUB',
          unitCode: 'HUR',
          unitText: 'час',
        },
      },
    }),
    ...(freelancer.rating && freelancer.completed_projects && freelancer.completed_projects > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: freelancer.rating,
        ratingCount: freelancer.completed_projects,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
    memberOf: {
      '@type': 'Organization',
      name: 'WorkFinder',
      url: siteUrl,
    },
  }
  
  return <StructuredData type="Person" data={structuredData} />
}

// Для страницы категории/услуг
interface CategoryStructuredDataProps {
  category: {
    id: string
    name: string
    description?: string
    project_count: number
    average_budget?: number
  }
}

export function CategoryStructuredData({ category }: CategoryStructuredDataProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workfinder.ru'
  const categoryUrl = `${siteUrl}/categories/${category.id}`
  
  const structuredData = {
    '@type': 'ItemList',
    name: category.name,
    description: category.description || `Услуги в категории ${category.name}`,
    url: categoryUrl,
    numberOfItems: category.project_count,
    itemListElement: {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'Service',
        name: category.name,
        description: category.description,
        ...(category.average_budget && {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'RUB',
            lowPrice: Math.round(category.average_budget * 0.7),
            highPrice: Math.round(category.average_budget * 1.3),
            offerCount: category.project_count,
          },
        }),
      },
    },
  }
  
  return <StructuredData type="ItemList" data={structuredData} />
}

// Для страницы поиска
export function SearchStructuredData(query: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workfinder.ru'
  
  return (
    <StructuredData
      type="SearchResultsPage"
      data={{
        name: `Результаты поиска: ${query}`,
        url: `${siteUrl}/search?q=${encodeURIComponent(query)}`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: 0, // Динамическое значение
          itemListElement: [], // Динамическое значение
        },
      }}
    />
  )
}

// Breadcrumb для навигации
interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string
    url: string
    position: number
  }>
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(item => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      item: item.url,
    })),
  }
  
  return <StructuredData type="BreadcrumbList" data={structuredData} />
}