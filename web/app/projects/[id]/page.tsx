'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  Clock, 
  Briefcase, 
  CheckCircle,
  Share2,
  Bookmark,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Loader2,
  Eye,
  MessageSquare,
  Star,
  Award,
  FileText,
  Users,
  TrendingUp,
  Shield,
  BadgeCheck,
  Globe,
  Home,
  Edit,
  Trash2,
  MoreVertical,
  Building,
  Phone,
  Mail,
  Globe as GlobeIcon,
  Map,
  Image as ImageIcon,
  Download,
  Folder,
  Tag,
  Target,
  CheckSquare,
  XCircle,
  Award as AwardIcon,
  Zap,
  Heart,
  Send,
  X,
  HelpCircle,
  Info,
  CalendarDays,
  Target as TargetIcon,
  Percent,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Project } from '@/types/project.types';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProjectWithRelations extends Project {
  client?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    rating: number;
    reviews_count: number;
    company_name?: string;
    website?: string;
    created_at: string;
    active_projects?: number;
    completed_projects?: number;
    total_projects?: number;
  };
  bids_count: number;
  avg_bid_amount?: number;
  images?: string[];
  attachments?: string[];
}

interface BidFormData {
  description: string;
  amount: number | '';
  timeline: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<ProjectWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [bidForm, setBidForm] = useState<BidFormData>({
    description: '',
    amount: '',
    timeline: ''
  });
  const [messageText, setMessageText] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchProject();
    checkUser();
  }, [projectId]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Ошибка проверки пользователя:', error);
    }
  };

 const fetchProject = async () => {
  try {
    setLoading(true);
    setError(null);
    
    console.log('🔄 Загрузка проекта ID:', projectId);
    
    // Загружаем основной проект
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !projectData) {
      throw new Error('Проект не найден');
    }

    // Проверяем, является ли текущий пользователь владельцем
    const { data: { user } } = await supabase.auth.getUser();
    if (user && projectData.client_id === user.id) {
      setIsOwner(true);
    }

      // 2. Загружаем клиента отдельно
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', projectData.client_id)
        .single();

      if (clientError) {
        console.warn('⚠️ Не удалось загрузить клиента:', clientError);
      }

      // 3. Загружаем статистику клиента
      let clientStats = {
        active_projects: 0,
        completed_projects: 0,
        total_projects: 0
      };

      if (clientData) {
        const { count: activeProjects } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', clientData.id)
          .eq('status', 'published');

        const { count: completedProjects } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', clientData.id)
          .eq('status', 'completed');

        const { count: totalProjects } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', clientData.id);

        clientStats = {
          active_projects: activeProjects || 0,
          completed_projects: completedProjects || 0,
          total_projects: totalProjects || 0
        };
      }

      // 4. Загружаем количество заявок
      const { count: bidsCount, error: bidsError } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (bidsError) {
        console.warn('⚠️ Не удалось загрузить количество заявок:', bidsError);
      }

      // 5. Загружаем заявки для расчета средней цены
      const { data: bidsData } = await supabase
        .from('bids')
        .select('amount')
        .eq('project_id', projectId)
        .eq('status', 'pending');

      const avgBidAmount = bidsData && bidsData.length > 0 
        ? bidsData.reduce((sum, bid) => sum + (bid.amount || 0), 0) / bidsData.length
        : undefined;

     // 6. Загружаем изображения проекта (если есть)
let images: string[] = [];
try {
  console.log('🖼️ Загружаем изображения для проекта:', projectId);
  
  // Вариант 1: Из поля images в таблице projects
  if (projectData.images && Array.isArray(projectData.images) && projectData.images.length > 0) {
    console.log('📸 Используем изображения из поля проекта:', projectData.images);
    images = projectData.images.filter(url => url && typeof url === 'string');
  }
  // Вариант 2: Из Supabase Storage
  else {
    console.log('📂 Ищем изображения в Supabase Storage...');
    
    // Пробуем разные пути
    const possiblePaths = [
      `${projectId}`,
      `projects/${projectId}`,
      `project-images/${projectId}`,
    ];
    
    for (const path of possiblePaths) {
      console.log(`🔍 Проверяем путь: ${path}`);
      const { data: imagesData, error } = await supabase
        .storage
        .from('project-images')
        .list(path);
      
      if (error) {
        console.warn(`⚠️ Ошибка при проверке пути ${path}:`, error.message);
        continue;
      }
      
      if (imagesData && imagesData.length > 0) {
        console.log(`✅ Найдено ${imagesData.length} изображений по пути: ${path}`);
        images = imagesData.map(img => {
          const { data: urlData } = supabase.storage
            .from('project-images')
            .getPublicUrl(`${path}/${img.name}`);
          return urlData.publicUrl;
        }).filter(url => url);
        break;
      }
    }
  }
  
  console.log(`📊 Итоговый список изображений:`, images);
  
  if (images.length === 0) {
    console.log('⚠️ Изображения не найдены ни в одном источнике');
  }
} catch (storageError) {
  console.error('🔥 Ошибка загрузки изображений:', storageError);
}

      // 7. Формируем полный объект проекта
      const fullProject: ProjectWithRelations = {
        ...projectData,
        client: clientData ? {
          id: clientData.id,
          first_name: clientData.first_name || '',
          last_name: clientData.last_name || '',
          email: clientData.email,
          phone: clientData.phone,
          avatar_url: clientData.avatar_url,
          rating: clientData.rating || 0,
          reviews_count: clientData.reviews_count || 0,
          company_name: clientData.company_name,
          website: clientData.website,
          created_at: clientData.created_at,
          active_projects: clientStats.active_projects,
          completed_projects: clientStats.completed_projects,
          total_projects: clientStats.total_projects
        } : {
          id: projectData.client_id || '',
          first_name: 'Неизвестный',
          last_name: 'клиент',
          rating: 0,
          reviews_count: 0,
          created_at: projectData.created_at,
          active_projects: 0,
          completed_projects: 0,
          total_projects: 0
        },
        bids_count: bidsCount || 0,
        avg_bid_amount: avgBidAmount,
        images
      };

      console.log('✅ Проект загружен:', {
        id: fullProject.id,
        title: fullProject.title,
        client: fullProject.client?.first_name,
        bidsCount: fullProject.bids_count
      });

      setProject(fullProject);
      
      // Проверяем, является ли пользователь владельцем проекта
      if (user && fullProject.client_id === user.id) {
        setIsOwner(true);
      }

      // 8. Увеличиваем счетчик просмотров (если не владелец)
      if (user?.id !== projectData.client_id && projectData.views_count !== undefined) {
        await supabase
          .from('projects')
          .update({ views_count: (projectData.views_count || 0) + 1 })
          .eq('id', projectId);
      }

    } catch (err: any) {
      console.error('🔥 Ошибка загрузки проекта:', err);
      setError(err.message || 'Не удалось загрузить проект');
      
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные проекта",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMMM yyyy 'в' HH:mm", { locale: ru });
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd.MM.yy", { locale: ru });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'RUB') => {
    const formatter = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(amount);
  };

  const handleApplyClick = () => {
    if (!project) return;
    
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему, чтобы подать заявку",
        variant: "destructive"
      });
      router.push(`/login?redirect=/projects/${projectId}&action=apply`);
      return;
    }
    
    if (project.status !== 'published') {
      toast({
        title: "Проект недоступен",
        description: "Этот проект уже закрыт или находится в работе",
        variant: "destructive"
      });
      return;
    }
    
    if (isOwner) {
      toast({
        title: "Невозможно подать заявку",
        description: "Вы не можете подавать заявки на свои собственные проекты",
        variant: "destructive"
      });
      return;
    }
    
    // Проверяем, не подавал ли пользователь уже заявку
    checkExistingBid();
  };

  const checkExistingBid = async () => {
    if (!user || !project) return;
    
    try {
      const { data: existingBid } = await supabase
        .from('bids')
        .select('id')
        .eq('project_id', project.id)
        .eq('freelancer_id', user.id)
        .eq('status', 'pending')
        .single();

      if (existingBid) {
        toast({
          title: "Заявка уже подана",
          description: "Вы уже отправили заявку на этот проект",
          variant: "destructive"
        });
        return;
      }

    } catch (error) {
      // Если заявки нет, продолжаем
    }
  };

  const handleSubmitBid = async () => {
    if (!project || !user || isSubmittingBid) return;

    // Валидация
    if (!bidForm.description.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите сопроводительное письмо",
        variant: "destructive"
      });
      return;
    }

    if (!bidForm.timeline.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите срок выполнения",
        variant: "destructive"
      });
      return;
    }

    // Если в проекте указан бюджет, но пользователь не указал цену
    if (project.budget && bidForm.amount === '') {
      toast({
        title: "Ошибка",
        description: "Укажите вашу цену",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingBid(true);

    try {
      const bidData = {
        project_id: project.id,
        freelancer_id: user.id,
        description: bidForm.description,
        amount: bidForm.amount !== '' ? Number(bidForm.amount) : null,
        timeline: bidForm.timeline,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('bids')
        .insert(bidData);

      if (error) throw error;

      toast({
        title: "Заявка отправлена",
        description: "Ваша заявка успешно отправлена заказчику",
      });

      // Обновляем счетчик заявок
      await fetchProject();
      
      // Сбрасываем форму
      setBidForm({
        description: '',
        amount: '',
        timeline: ''
      });

    } catch (error: any) {
      console.error('Ошибка при отправке заявки:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить заявку",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleSendMessage = async () => {
    if (!project?.client?.id || !user || isSubmittingMessage) return;

    if (!messageText.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст сообщения",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingMessage(true);

    try {
      // Создаем или получаем существующий чат
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          project_id: project.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (chatError && !chatError.message.includes('duplicate')) {
        throw chatError;
      }

      let chatId = chatData?.id;

      // Если чат уже существует, ищем его
      if (!chatId) {
        const { data: existingChat } = await supabase
          .from('chats')
          .select('id')
          .eq('project_id', project.id)
          .single();

        chatId = existingChat?.id;
      }

      // Добавляем участников в чат
      await supabase
        .from('chat_participants')
        .upsert([
          {
            chat_id: chatId,
            user_id: user.id,
            joined_at: new Date().toISOString()
          },
          {
            chat_id: chatId,
            user_id: project.client.id,
            joined_at: new Date().toISOString()
          }
        ]);

      // Отправляем сообщение
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: messageText,
          created_at: new Date().toISOString(),
          read: false
        });

      if (messageError) throw messageError;

      toast({
        title: "Сообщение отправлено",
        description: "Сообщение успешно отправлено заказчику",
      });

      setShowMessageDialog(false);
      setMessageText('');

    } catch (error: any) {
      console.error('Ошибка при отправке сообщения:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить сообщение",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const handleSaveProject = async () => {
    if (!project || isSaving || !user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('saved_projects')
        .insert({
          user_id: user.id,
          project_id: project.id
        });

      if (error) throw error;

      toast({
        title: "Проект сохранен",
        description: "Проект добавлен в избранное",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить проект",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!project) return;
    
    const shareData = {
      title: project.title,
      text: project.description.substring(0, 100) + '...',
      url: window.location.href,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Отмена шеринга');
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Ссылка скопирована",
        description: "Ссылка на проект скопирована в буфер обмена",
      });
    }
  };

  const handleEditProject = () => {
    router.push(`/dashboard/projects/${projectId}/edit`);
  };

  const handleDeleteProject = async () => {
    if (!project || !isOwner) return;
    
    if (!confirm('Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: "Проект удален",
        description: "Проект успешно удален",
      });
      
      router.push('/dashboard/my-projects');
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить проект",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Активен</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">В работе</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Завершен</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Отменен</Badge>;
      default:
        return <Badge variant="outline">Черновик</Badge>;
    }
  };

  const getBudgetDisplay = () => {
    if (!project) return 'По договоренности';
    
    if (project.budget) {
      return formatCurrency(project.budget, project.currency);
    }
    
    return 'По договоренности';
  };

  // Загрузка
  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-6 w-48" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Ошибка
  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">
                {error || 'Проект не найден'}
              </h2>
              <p className="text-gray-600 mb-8">
                Возможно, проект был удален или у вас нет к нему доступа
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => router.back()} variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </Button>
                <Button onClick={fetchProject} variant="outline" className="gap-2">
                  <Loader2 className="h-4 w-4" />
                  Повторить
                </Button>
                <Button onClick={() => router.push('/projects')} className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Все проекты
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          {/* Основная карточка проекта */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 overflow-hidden mb-6">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(project.status)}
                    
                    {project.is_urgent && (
                      <Badge variant="destructive" className="animate-pulse gap-1">
                        <Zap className="h-3 w-3" />
                        Срочно
                      </Badge>
                    )}
                    
                    {project.is_featured && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1">
                        <AwardIcon className="h-3 w-3" />
                        Рекомендуемый
                      </Badge>
                    )}
                    
                    <Badge variant="outline" className="gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {(project.bids_count || 0).toLocaleString()} заявок
                    </Badge>
                    
                    <Badge variant="outline" className="gap-1">
                      <Eye className="h-3 w-3" />
                      {(project.views_count || 0).toLocaleString()} просмотров
                    </Badge>
                  </div>
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl md:text-3xl leading-tight">
                        {project.title}
                      </CardTitle>
                    </div>
                    
                    {isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Действия с проектом</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleEditProject} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleDeleteProject} className="cursor-pointer text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить проект
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleShare}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Поделиться
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSaveProject}
                    disabled={isSaving || !user}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                    Сохранить
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pb-6">
  {/* Объединенный блок: Изображения + Информация о проекте */}
  <div className="space-y-8">
    {/* Изображения проекта */}
    {project.images && project.images.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-blue-600" />
          Галерея проекта
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.images.slice(0, 6).map((img, index) => (
            <div key={index} className="relative aspect-video rounded-lg overflow-hidden border hover:shadow-md transition-shadow">
              <Image
                src={img}
                alt={`Изображение проекта ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Подробное описание проекта */}
    {project.detailed_description && (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Подробное описание проекта
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-line text-gray-700 leading-relaxed">
              {project.detailed_description}
            </div>
          </div>
        </CardContent>
      </Card>
    )}

    {/* Информация о проекте - объединенный блок */}
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          Детали проекта
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левый столбец: Бюджет и детали */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Бюджет проекта
              </h3>
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-100">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {getBudgetDisplay()}
                </div>
                <div className="flex flex-col items-center gap-1 text-sm text-gray-600">
                  <span>Валюта: {project.currency}</span>
                  {project.avg_bid_amount && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Средняя заявка: {formatCurrency(project.avg_bid_amount, project.currency)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Локация</p>
                  <p className="font-medium">
                    {project.location?.isRemote ? (
                      <span className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        Удаленная работа
                      </span>
                    ) : (
                      `${project.city || project.location?.city || 'Не указано'}${project.country || project.location?.country ? ', ' + (project.country || project.location?.country) : ''}`
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Срок выполнения</p>
                  <p className="font-medium">{project.timeline?.estimatedDuration || 'Не указан'}</p>
                </div>
              </div>
              
              {project.deadline && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Дедлайн</p>
                    <p className="font-medium">{formatDate(project.deadline)}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Навыки */}
            {project.skills && project.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Требуемые навыки
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-sm py-2 px-3 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Правый столбец: Хронология и детали */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                Хронология проекта
              </h3>
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Опубликован</span>
                  <span className="font-medium">{formatDate(project.published_at || project.created_at)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Создан</span>
                  <span className="font-medium">{formatDate(project.created_at)}</span>
                </div>
                
                {project.expires_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Действует до</span>
                    <span className="font-medium">{formatDate(project.expires_at)}</span>
                  </div>
                )}
                
                {project.timeline?.startDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Начало работ</span>
                    <span className="font-medium">{formatDate(project.timeline.startDate)}</span>
                  </div>
                )}
                
                {project.timeline?.endDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Завершение работ</span>
                    <span className="font-medium">{formatDate(project.timeline.endDate)}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Категория и статус */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Категория</p>
                  <p className="font-medium">
                    {project.category}
                    {project.subcategory && (
                      <span className="text-gray-600 text-sm ml-2">({project.subcategory})</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Теги */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Теги</p>
                    <div className="flex flex-wrap gap-1">
                      {project.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Информация о дате публикации внизу блока */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Проект опубликован {formatDate(project.published_at || project.created_at)}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {(project.views_count || 0).toLocaleString()} просмотров
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {(project.bids_count || 0).toLocaleString()} заявок
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</CardContent>

            {/* Форма подачи заявки - постоянно на странице */}
       {
  !isOwner && project.status === 'published' && (
    <CardFooter className="border-t pt-6 bg-gray-50">
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-600" />
          Подать заявку на проект
        </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="description">Сопроводительное письмо *</Label>
                        <Textarea
                          id="description"
                          placeholder="Расскажите, почему вы подходите для этого проекта..."
                          value={bidForm.description}
                          onChange={(e) => setBidForm({...bidForm, description: e.target.value})}
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {project.budget ? (
                          <div className="space-y-2">
                            <Label htmlFor="amount">Ваша цена ({project.currency}) *</Label>
                            <div className="relative">
                              <Input
                                id="amount"
                                type="number"
                                placeholder="Введите сумму"
                                value={bidForm.amount}
                                onChange={(e) => setBidForm({...bidForm, amount: e.target.value === '' ? '' : Number(e.target.value)})}
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                {project.currency}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="amount">Ваша цена ({project.currency})</Label>
                            <div className="relative">
                              <Input
                                id="amount"
                                type="number"
                                placeholder="Укажите вашу цену"
                                value={bidForm.amount}
                                onChange={(e) => setBidForm({...bidForm, amount: e.target.value === '' ? '' : Number(e.target.value)})}
                              />
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                {project.currency}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label htmlFor="timeline">Срок выполнения *</Label>
                          <Input
                            id="timeline"
                            placeholder="Например: 7 дней"
                            value={bidForm.timeline}
                            onChange={(e) => setBidForm({...bidForm, timeline: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Бюджет проекта: <span className="font-semibold">{getBudgetDisplay()}</span>
                        {project.avg_bid_amount && (
                          <span className="ml-4">
                            Средняя заявка: <span className="font-semibold">{formatCurrency(project.avg_bid_amount, project.currency)}</span>
                          </span>
                        )}
                      </div>
                      
                      <Button 
                        onClick={user ? handleSubmitBid : () => router.push(`/login?redirect=/projects/${projectId}&action=apply`)}
                        disabled={isSubmittingBid || (project.budget && bidForm.amount === '')}
                        className="gap-2"
                      >
                        {isSubmittingBid ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Отправка...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            {user ? 'Отправить заявку' : 'Войти для подачи заявки'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>

          {/* Заказчик */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Информация о заказчике
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl flex-1">
                  <Avatar className="h-20 w-20 border-2 border-white shadow-md">
                    <AvatarImage src={project.client?.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl">
                      {project.client?.first_name?.[0]}{project.client?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-xl">
                      {project.client?.first_name || 'Неизвестный'} {project.client?.last_name || 'клиент'}
                    </h4>
                    
                    {project.client?.company_name && (
                      <p className="text-gray-600 flex items-center gap-1 mt-1">
                        <Building className="h-4 w-4" />
                        {project.client.company_name}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-700">{project.client?.total_projects || 0}</div>
                        <div className="text-xs text-gray-600">Всего проектов</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-700">{project.client?.active_projects || 0}</div>
                        <div className="text-xs text-gray-600">Активные</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-700">{project.client?.completed_projects || 0}</div>
                        <div className="text-xs text-gray-600">Завершенные</div>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded-lg">
                        <div className="flex items-center justify-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                          <span className="text-lg font-bold text-yellow-700">
                            {(project.client?.rating || 0).toFixed(1)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {(project.client?.reviews_count || 0).toLocaleString()} отзывов
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mt-3">
                      <Calendar className="h-4 w-4 mr-1" />
                      На сайте с {formatShortDate(project.client?.created_at || project.created_at)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 min-w-[200px]">
                  <Button 
                    variant="outline" 
                    className="w-full justify-center gap-2"
                    onClick={() => setShowProfileDialog(true)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Профиль заказчика
                  </Button>
                  
                  <Button 
                    className="w-full justify-center gap-2"
                    onClick={() => user ? setShowMessageDialog(true) : router.push(`/login?redirect=/projects/${projectId}`)}
                    disabled={isOwner}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {user ? 'Написать сообщение' : 'Войти для общения'}
                  </Button>
                  
                  {project.client?.website && (
                    <Button variant="ghost" className="w-full justify-center gap-2" asChild>
                      <a href={project.client.website} target="_blank" rel="noopener noreferrer">
                        <GlobeIcon className="h-4 w-4" />
                        Веб-сайт
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      {/* Диалог профиля заказчика */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Профиль заказчика
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={project.client?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {project.client?.first_name?.[0]}{project.client?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="text-xl font-semibold">
                {project.client?.first_name} {project.client?.last_name}
              </h3>
              
              {project.client?.company_name && (
                <p className="text-gray-600 mt-1">
                  <Building className="h-4 w-4 inline-block mr-1" />
                  {project.client.company_name}
                </p>
              )}
            </div>
            
            <Separator />
            
            {/* Статистика клиента */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-700">{project.client?.total_projects || 0}</div>
                <div className="text-xs text-gray-600 mt-1">Всего проектов</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl font-bold text-green-700">{project.client?.active_projects || 0}</div>
                <div className="text-xs text-gray-600 mt-1">Активные</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-700">{project.client?.completed_projects || 0}</div>
                <div className="text-xs text-gray-600 mt-1">Завершенные</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">На сайте с</span>
                <span className="font-medium">{formatShortDate(project.client?.created_at || project.created_at)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Рейтинг</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                  <span className="font-medium">{(project.client?.rating || 0).toFixed(1)}</span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({(project.client?.reviews_count || 0).toLocaleString()} отзывов)
                  </span>
                </div>
              </div>
              
              {project.client?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{project.client.email}</span>
                </div>
              )}
              
              {project.client?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{project.client.phone}</span>
                </div>
              )}
              
              {project.client?.website && (
                <div className="flex items-center gap-3">
                  <GlobeIcon className="h-4 w-4 text-gray-500" />
                  <a 
                    href={project.client.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {project.client.website}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileDialog(false)}>
              Закрыть
            </Button>
            <Button onClick={() => {
              setShowProfileDialog(false);
              setShowMessageDialog(true);
            }}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Написать сообщение
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог отправки сообщения */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Написать сообщение
            </DialogTitle>
            <DialogDescription>
              Отправьте сообщение заказчику проекта
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={project.client?.avatar_url} />
                <AvatarFallback>
                  {project.client?.first_name?.[0]}{project.client?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{project.client?.first_name} {project.client?.last_name}</p>
                <p className="text-sm text-gray-500">Заказчик проекта</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Сообщение *</Label>
              <Textarea
                id="message"
                placeholder="Напишите ваше сообщение..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSendMessage} disabled={isSubmittingMessage}>
              {isSubmittingMessage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Отправить сообщение
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}