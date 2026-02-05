// /web/app/dashboard/projects/[id]/edit/page.tsx - ОБНОВЛЕННАЯ
'use client'

import { Suspense } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CreateProjectForm from '@/components/projects/CreateProjectForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EditProjectPageProps {
  params: {
    id: string
  }
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const projectId = params.id

  return (
    
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                asChild
              >
                <Link href={`/projects/${projectId}`}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <CardTitle className="text-2xl">Редактирование проекта</CardTitle>
                <p className="text-gray-600 mt-2">
                  Внесите изменения в проект
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="py-16 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Загрузка формы...</p>
              </div>
            }>
              <CreateProjectForm projectId={projectId} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
   
  )
}