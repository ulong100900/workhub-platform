'use client'

import Head from 'next/head'

interface MetaTagsProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
}

export default function MetaTags({
  title = 'WorkFinder — Фриланс биржа для профессионалов',
  description = 'Найдите лучших фрилансеров или начните зарабатывать на своих навыках. Более 1000 успешных проектов!',
  keywords = ['фриланс', 'удаленная работа', 'фрилансеры'],
  image = '/og-image.png',
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
}: MetaTagsProps) {
  const fullTitle = title.includes('WorkFinder') ? title : `${title} | WorkFinder`
  const fullUrl = url ? `https://workfinder.ru${url}` : 'https://workfinder.ru'
  const fullImage = image.startsWith('http') ? image : `https://workfinder.ru${image}`

  return (
    <Head>
      {/* Основные мета-теги */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="WorkFinder" />
      <meta property="og:locale" content="ru_RU" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Дополнительные OG теги для статей */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {section && <meta property="article:section" content={section} />}
      {tags && tags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}
      
      {/* Каноническая ссылка */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Альтернативные языки */}
      <link rel="alternate" hrefLang="ru" href={fullUrl} />
      <link rel="alternate" hrefLang="x-default" href={fullUrl} />
    </Head>
  )
}