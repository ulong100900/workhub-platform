'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'
import { 
  Shield, 
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  FileText,
  Briefcase,
  Award,
  UserCheck,
  Lock,
  Activity
} from 'lucide-react'

interface ProfileStats {
  completed_projects: number
  rating: number
  success_rate: number
  avg_response_time: string
  total_earned: number
  active_orders: number
  total_reviews: number
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('Не удалось загрузить данные пользователя')
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Ошибка загрузки профиля:', profileError)
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            created_at: new Date().toISOString()
          }])
          .select()
          .single()

        setProfile(newProfile || {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Пользователь',
          avatar_url: user.user_metadata?.avatar_url || ''
        })
      } else {
        setProfile(profileData || {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Пользователь',
          avatar_url: user.user_metadata?.avatar_url || ''
        })
      }

      const mockStats: ProfileStats = {
        completed_projects: 12,
        rating: 4.8,
        success_rate: 95,
        avg_response_time: '2ч 30м',
        total_earned: 125000,
        active_orders: 3,
        total_reviews: 8
      }
      setStats(mockStats)

    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
      toast({
        variant: 'destructive',
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить данные профиля'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async (data: any) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Пользователь не найден')

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.user.id,
          full_name: data.full_name,
          phone: data.phone,
          bio: data.bio,
          skills: data.skills,
          experience_years: data.experience,
          portfolio_url: data.portfolio_url,
          location: data.location,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: 'Профиль обновлен',
        description: 'Изменения успешно сохранены',
      })
      await loadProfileData()
      return true
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Ошибка сохранения',
        description: error.message || 'Попробуйте позже',
      })
      return false
    }
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Пользователь не найден')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.user.id)

      if (updateError) throw updateError

      toast({
        title: 'Аватар обновлен',
        description: 'Изображение успешно загружено',
      })
      
      await loadProfileData()
      return publicUrl
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Ошибка загрузки',
        description: error.message || 'Не удалось загрузить изображение',
      })
      return null
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-80" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-10 w-32 rounded-lg" />
          ))}
        </div>

        <div className="grid gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const userInitial = profile?.full_name?.charAt(0).toUpperCase() || 
                     profile?.email?.charAt(0).toUpperCase() || 
                     'U'

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-white/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-2xl bg-white/20">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">
                {profile?.full_name || 'Заполните профиль'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {profile?.email || 'Email не указан'}
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </span>
                )}
                {profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
              </div>
              {profile?.bio && (
                <p className="text-white/90 max-w-2xl mt-2 line-clamp-2">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
            <Shield className="h-4 w-4 mr-2" />
            Аккаунт защищен
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger 
            value="profile" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Профиль
          </TabsTrigger>
          <TabsTrigger 
            value="stats" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Статистика
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
          >
            <Lock className="h-4 w-4 mr-2" />
            Безопасность
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
          >
            <Activity className="h-4 w-4 mr-2" />
            Активность
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileForm
            initialData={{
              full_name: profile?.full_name || '',
              email: profile?.email || '',
              phone: profile?.phone || '',
              bio: profile?.bio || '',
              skills: profile?.skills || [],
              experience: profile?.experience_years || 0,
              portfolio_url: profile?.portfolio_url || '',
              location: profile?.location || '',
            }}
            onSave={handleSaveProfile}
            onAvatarUpload={handleAvatarUpload}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto py-3"
                  onClick={() => router.push('/dashboard/portfolio')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Портфолио</div>
                    <div className="text-sm text-gray-500">Добавьте работы</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto py-3"
                  onClick={() => router.push('/dashboard/reviews')}
                >
                  <Star className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Отзывы</div>
                    <div className="text-sm text-gray-500">{stats?.total_reviews || 0} отзывов</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto py-3"
                  onClick={() => router.push('/dashboard/calendar')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Календарь</div>
                    <div className="text-sm text-gray-500">Расписание</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-auto py-3"
                  onClick={() => router.push('/dashboard/finance')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Финансы</div>
                    <div className="text-sm text-gray-500">Баланс и платежи</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Завершено проектов</p>
                    <h3 className="text-2xl font-bold mt-1">{stats?.completed_projects || 0}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Рейтинг</p>
                    <h3 className="text-2xl font-bold mt-1">{stats?.rating?.toFixed(1) || '5.0'}<span className="text-sm text-gray-500">/5</span></h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Успешных сделок</p>
                    <h3 className="text-2xl font-bold mt-1">{stats?.success_rate || 0}%</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Всего заработано</p>
                    <h3 className="text-2xl font-bold mt-1">
                      {stats?.total_earned ? 
                        new Intl.NumberFormat('ru-RU').format(stats.total_earned) + ' ₽' : 
                        '0 ₽'
                      }
                    </h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Среднее время ответа</p>
                    <h3 className="text-2xl font-bold mt-1">{stats?.avg_response_time || '24ч'}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Активные заказы</p>
                    <h3 className="text-2xl font-bold mt-1">{stats?.active_orders || 0}</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Безопасность аккаунта
              </CardTitle>
              <CardDescription>
                Настройте параметры безопасности для защиты вашего аккаунта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Двухфакторная аутентификация
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">Добавьте дополнительный уровень защиты</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Настроить
                  </Button>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Смена пароля</h4>
                    <p className="text-sm text-gray-500 mt-1">Рекомендуется менять пароль каждые 3 месяца</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/dashboard/settings?tab=security')}
                  >
                    Сменить
                  </Button>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Активные сессии</h4>
                    <p className="text-sm text-gray-500 mt-1">Управление устройствами с доступом к аккаунту</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Просмотреть
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                История активности
              </CardTitle>
              <CardDescription>
                Последние действия в вашем аккаунте
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">История активности скоро появится</h3>
                <p className="text-gray-500 mb-6">
                  Здесь будут отображаться ваши последние действия на платформе
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => router.push('/dashboard/orders')}>
                    Перейти к заказам
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/projects')}>
                    Найти проекты
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}