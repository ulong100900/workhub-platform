// components/bids/PublicBidCard.tsx
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  CheckCircle,
  Clock,
  Star,
  User,
  Calendar,
  DollarSign,
  MessageSquare,
  Eye,
  Briefcase,
} from 'lucide-react';

interface PublicBid {
  id: string;
  proposal: string;
  price: number;
  delivery_days: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  order: {
    id: string;
    title: string;
    budget: number;
    status: string;
    category: string;
  };
  freelancer: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    rating: number;
    completed_projects: number;
    specialization: string;
  };
}

interface PublicBidCardProps {
  bid: PublicBid;
  onViewOrder?: () => void;
  onViewFreelancer?: () => void;
}

export function PublicBidCard({ bid, onViewOrder, onViewFreelancer }: PublicBidCardProps) {
  const getStatusConfig = (status: PublicBid['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Ожидает',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          iconColor: 'text-blue-500',
        };
      case 'accepted':
        return {
          icon: CheckCircle,
          label: 'Принято',
          color: 'bg-green-100 text-green-800 border-green-200',
          iconColor: 'text-green-500',
        };
      default:
        return {
          icon: Clock,
          label: status,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          iconColor: 'text-gray-500',
        };
    }
  };

  const statusConfig = getStatusConfig(bid.status);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={bid.freelancer.avatar_url || ''} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg cursor-pointer hover:text-primary" onClick={onViewFreelancer}>
                  {bid.freelancer.full_name}
                </h3>
                {statusConfig && (
                  <Badge variant="outline" className={`${statusConfig.color} flex items-center gap-1`}>
                    <statusConfig.icon className={`h-3 w-3 ${statusConfig.iconColor}`} />
                    {statusConfig.label}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Star className="h-3 w-3 mr-1 text-amber-500" />
                  <span>{bid.freelancer.rating?.toFixed(1) || 'Нет оценок'}</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-3 w-3 mr-1" />
                  <span>{bid.freelancer.completed_projects || 0} проектов</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {bid.freelancer.specialization}
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(bid.price)} ₽
            </div>
            <div className="text-sm text-muted-foreground">
              Бюджет: {formatCurrency(bid.order.budget)} ₽
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Заголовок заказа */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm font-medium">
              <DollarSign className="h-4 w-4 mr-2" />
              Заказ: 
              <span className="ml-2 cursor-pointer hover:text-primary" onClick={onViewOrder}>
                {bid.order.title}
              </span>
            </div>
            <Badge variant="outline">{bid.order.category}</Badge>
          </div>
        </div>

        {/* Срок и дата */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              Срок выполнения
            </div>
            <div className="font-medium">{bid.delivery_days} дней</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              Дата отправки
            </div>
            <div className="font-medium">
              {format(new Date(bid.created_at), 'dd MMMM yyyy', { locale: ru })}
            </div>
          </div>
        </div>

        {/* Предложение */}
        {bid.proposal && (
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium">
              <MessageSquare className="h-4 w-4 mr-2" />
              Предложение
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {bid.proposal}
            </p>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex space-x-2 pt-2">
          {onViewOrder && (
            <Button variant="outline" size="sm" onClick={onViewOrder}>
              <Eye className="h-4 w-4 mr-2" />
              Смотреть заказ
            </Button>
          )}
          {onViewFreelancer && (
            <Button variant="outline" size="sm" onClick={onViewFreelancer}>
              <User className="h-4 w-4 mr-2" />
              Профиль фрилансера
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}