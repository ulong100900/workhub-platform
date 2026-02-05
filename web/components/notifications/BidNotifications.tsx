// web/src/components/notifications/BidNotifications.tsx
import React, { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { bidService } from '@/services/bids';
import { useAuth } from '@/hooks/useAuth';
import { Bell } from 'lucide-react';

export function BidNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Подписка на новые предложения для проектов пользователя
    const subscription = bidService.subscribeToFreelancerBids(user.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        const bid = payload.new;
        toast({
          title: 'Новое предложение!',
          description: `Вы получили новое предложение на проект "${bid.project?.title}"`,
          action: (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = `/projects/${bid.project_id}/bids`}
            >
              Посмотреть
            </Button>
          ),
        });
      } else if (payload.eventType === 'UPDATE') {
        const bid = payload.new;
        const oldStatus = payload.old?.status;
        
        if (oldStatus === 'pending' && bid.status === 'accepted') {
          toast({
            title: '🎉 Предложение принято!',
            description: `Заказчик принял ваше предложение на проект "${bid.project?.title}"`,
            variant: 'default',
          });
        } else if (oldStatus === 'pending' && bid.status === 'rejected') {
          toast({
            title: 'Предложение отклонено',
            description: `К сожалению, ваше предложение на проект "${bid.project?.title}" было отклонено`,
            variant: 'destructive',
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, toast]);

  return null; // Компонент не рендерит UI, только управляет уведомлениями
}