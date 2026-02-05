// /web/app/dashboard/projects/create/page.tsx - ОБНОВЛЕННАЯ
'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import CreateProjectForm from '@/components/projects/CreateProjectForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CreateProjectPage() {
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
                <Link href="/dashboard/my-projects">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <CardTitle className="text-2xl">Создание нового проекта</CardTitle>
                <p className="text-gray-600 mt-2">
                  Заполните все поля для публикации проекта
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CreateProjectForm />
          </CardContent>
        </Card>
      </div>
    
  )
}