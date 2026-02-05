// web/src/hooks/useBids.ts
import { useState, useEffect, useCallback } from 'react';
import { Bid, BidFilters } from '@/types/bids';
import { bidService } from '@/services/bids';
import { useToast } from '@/components/ui/use-toast';

export const useBids = (projectId?: string, freelancerId?: string) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadBids = useCallback(async (filters?: BidFilters) => {
    if (!projectId && !freelancerId) return;

    setLoading(true);
    setError(null);

    try {
      let data: Bid[];
      
      if (projectId) {
        data = await bidService.getProjectBids(projectId, filters);
        const statsData = await bidService.getBidStats(projectId);
        setStats(statsData);
      } else if (freelancerId) {
        data = await bidService.getFreelancerBids(freelancerId);
      } else {
        data = [];
      }
      
      setBids(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить предложения',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, freelancerId, toast]);

  useEffect(() => {
    loadBids();
  }, [loadBids]);

  const submitBid = async (bidData: any) => {
    try {
      const bid = await bidService.submitBid(bidData);
      
      // Обновляем список
      if (projectId) {
        setBids(prev => [bid, ...prev]);
        // Обновляем статистику
        const newStats = await bidService.getBidStats(projectId);
        setStats(newStats);
      }
      
      toast({
        title: 'Успешно!',
        description: 'Ваше предложение отправлено',
      });
      
      return bid;
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const acceptBid = async (bidId: string) => {
    try {
      const result = await bidService.acceptBid(bidId);
      
      if (result.success) {
        // Обновляем статус в списке
        setBids(prev => prev.map(bid => 
          bid.id === bidId 
            ? { ...bid, status: 'accepted' }
            : bid.project_id === projectId && bid.status === 'pending'
              ? { ...bid, status: 'rejected' }
              : bid
        ));
        
        toast({
          title: 'Успешно!',
          description: result.message,
        });
      } else {
        toast({
          title: 'Ошибка',
          description: result.message,
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const withdrawBid = async (bidId: string) => {
    try {
      const result = await bidService.withdrawBid(bidId);
      
      if (result.success) {
        // Удаляем из списка
        setBids(prev => prev.filter(bid => bid.id !== bidId));
        
        // Обновляем статистику
        if (projectId) {
          const newStats = await bidService.getBidStats(projectId);
          setStats(newStats);
        }
        
        toast({
          title: 'Успешно!',
          description: result.message,
        });
      }
      
      return result;
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateBid = async (bidId: string, updates: any) => {
    try {
      const updatedBid = await bidService.updateBid(bidId, updates);
      
      // Обновляем в списке
      setBids(prev => prev.map(bid => 
        bid.id === bidId ? updatedBid : bid
      ));
      
      toast({
        title: 'Успешно!',
        description: 'Предложение обновлено',
      });
      
      return updatedBid;
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const refresh = () => {
    loadBids();
  };

  return {
    bids,
    loading,
    error,
    stats,
    submitBid,
    acceptBid,
    withdrawBid,
    updateBid,
    refresh,
    loadBids,
  };
};