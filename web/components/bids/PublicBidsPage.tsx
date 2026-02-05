// components/bids/PublicBidsPage.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BidCard } from './BidCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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

type BidStatus = 'all' | 'pending' | 'accepted';

export default function PublicBidsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [bids, setBids] = useState<PublicBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<BidStatus>(
    (searchParams.get('status') as BidStatus) || 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [categories, setCategories] = useState<string[]>([]);

  const fetchBids = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const response = await fetch(`/api/bids/public?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bids');
      }

      const data = await response.json();
      setBids(data.bids || []);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(data.bids?.map((bid: PublicBid) => bid.order.category) || [])
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching bids:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить заявки',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, categoryFilter, toast]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (searchQuery) params.set('search', searchQuery);
    else params.delete('search');
    
    if (statusFilter !== 'all') params.set('status', statusFilter);
    else params.delete('status');
    
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    else params.delete('category');

    router.replace(`/bids?${params.toString()}`);
  }, [searchQuery, statusFilter, categoryFilter, router, searchParams]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all';

  const filteredBids = bids.filter(bid => {
    if (statusFilter !== 'all' && bid.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && bid.order.category !== categoryFilter) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        bid.proposal.toLowerCase().includes(query) ||
        bid.order.title.toLowerCase().includes(query) ||
        bid.freelancer.full_name.toLowerCase().includes(query) ||
        bid.freelancer.specialization.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Фильтры</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 px-2"
              >
                <X className="h-4 w-4 mr-1" />
                Очистить
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Используйте фильтры для поиска нужных заявок
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск заявок..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Статус</label>
              <Select value={statusFilter} onValueChange={(v: BidStatus) => setStatusFilter(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">Ожидающие</SelectItem>
                  <SelectItem value="accepted">Принятые</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Категория</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Обновить</label>
              <Button onClick={() => fetchBids()} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{bids.length}</div>
            <p className="text-sm text-muted-foreground">Всего заявок</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {bids.filter(b => b.status === 'pending').length}
            </div>
            <p className="text-sm text-muted-foreground">Ожидают ответа</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {bids.filter(b => b.status === 'accepted').length}
            </div>
            <p className="text-sm text-muted-foreground">Принятые</p>
          </CardContent>
        </Card>
      </div>

      {/* Список заявок */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            Все заявки
            <Badge variant="secondary" className="ml-2">
              {bids.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Ожидающие
            <Badge variant="secondary" className="ml-2">
              {bids.filter(b => b.status === 'pending').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Принятые
            <Badge variant="secondary" className="ml-2">
              {bids.filter(b => b.status === 'accepted').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {filteredBids.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Заявки не найдены</h3>
                <p className="text-muted-foreground">
                  {hasActiveFilters
                    ? 'Попробуйте изменить параметры фильтрации'
                    : 'На данный момент нет доступных заявок'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredBids.map((bid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                onViewOrder={() => router.push(`/projects/${bid.order.id}`)}
                onViewFreelancer={() => router.push(`/freelancers/${bid.freelancer.id}`)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {bids
            .filter(b => b.status === 'pending')
            .filter(bid => {
              if (categoryFilter !== 'all' && bid.order.category !== categoryFilter) return false;
              if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                  bid.proposal.toLowerCase().includes(query) ||
                  bid.order.title.toLowerCase().includes(query) ||
                  bid.freelancer.full_name.toLowerCase().includes(query)
                );
              }
              return true;
            })
            .map((bid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                onViewOrder={() => router.push(`/projects/${bid.order.id}`)}
                onViewFreelancer={() => router.push(`/freelancers/${bid.freelancer.id}`)}
              />
            ))}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4 mt-6">
          {bids
            .filter(b => b.status === 'accepted')
            .filter(bid => {
              if (categoryFilter !== 'all' && bid.order.category !== categoryFilter) return false;
              if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                  bid.proposal.toLowerCase().includes(query) ||
                  bid.order.title.toLowerCase().includes(query) ||
                  bid.freelancer.full_name.toLowerCase().includes(query)
                );
              }
              return true;
            })
            .map((bid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                onViewOrder={() => router.push(`/projects/${bid.order.id}`)}
                onViewFreelancer={() => router.push(`/freelancers/${bid.freelancer.id}`)}
              />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}