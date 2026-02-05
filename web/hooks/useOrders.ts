'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from '@/components/ui/use-toast'
import type { Order, Bid, OrderFormData, BidFormData, QueryParams } from '@/types'

const supabase = createClientComponentClient()

export function useOrders() {
  const queryClient = useQueryClient()

  // Получение списка заказов
  const useGetOrders = (params: QueryParams = {}) => {
    return useQuery({
      queryKey: ['orders', params],
      queryFn: async () => {
        let query = supabase
          .from('orders')
          .select('*, profiles!orders_customer_id_fkey(full_name, avatar_url)', {
            count: 'exact'
          })

        // Применяем фильтры
        if (params.search) {
          query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
        }
        
        if (params.category) {
          query = query.eq('category', params.category)
        }
        
        if (params.status) {
          query = query.eq('status', params.status)
        }
        
        if (params.minPrice) {
          query = query.gte('budget', params.minPrice)
        }
        
        if (params.maxPrice) {
          query = query.lte('budget', params.maxPrice)
        }

        // Сортировка
        if (params.sortBy) {
          query = query.order(params.sortBy, { 
            ascending: params.sortOrder === 'asc' 
          })
        } else {
          query = query.order('created_at', { ascending: false })
        }

        // Пагинация
        const page = params.page || 1
        const limit = params.limit || 10
        const from = (page - 1) * limit
        const to = from + limit - 1

        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) throw error

        return {
          items: data as Order[],
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit),
        }
      },
    })
  }

  // Получение одного заказа
  const useGetOrder = (id: string) => {
    return useQuery({
      queryKey: ['order', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            profiles!orders_customer_id_fkey(*),
            bids(*, profiles!bids_executor_id_fkey(*))
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        return data as Order
      },
      enabled: !!id,
    })
  }

  // Создание заказа
  const useCreateOrder = () => {
    return useMutation({
      mutationFn: async (orderData: OrderFormData) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Необходима авторизация')

        const { data, error } = await supabase
          .from('orders')
          .insert([
            {
              ...orderData,
              customer_id: user.id,
              status: 'draft',
            },
          ])
          .select()
          .single()

        if (error) throw error
        return data as Order
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        toast({
          title: 'Заказ создан',
          description: 'Заказ успешно создан и сохранен как черновик',
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Ошибка',
          description: error.message || 'Не удалось создать заказ',
          variant: 'destructive',
        })
      },
    })
  }

  // Обновление заказа
  const useUpdateOrder = () => {
    return useMutation({
      mutationFn: async ({ id, updates }: { id: string; updates: Partial<Order> }) => {
        const { data, error } = await supabase
          .from('orders')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data as Order
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        toast({
          title: 'Заказ обновлен',
          description: 'Изменения сохранены',
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Ошибка',
          description: error.message || 'Не удалось обновить заказ',
          variant: 'destructive',
        })
      },
    })
  }

  // Удаление заказа
  const useDeleteOrder = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', id)

        if (error) throw error
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        toast({
          title: 'Заказ удален',
          description: 'Заказ успешно удален',
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Ошибка',
          description: error.message || 'Не удалось удалить заказ',
          variant: 'destructive',
        })
      },
    })
  }

  // Публикация заказа
  const usePublishOrder = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { data, error } = await supabase
          .from('orders')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data as Order
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        toast({
          title: 'Заказ опубликован',
          description: 'Заказ теперь виден всем исполнителям',
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Ошибка',
          description: error.message || 'Не удалось опубликовать заказ',
          variant: 'destructive',
        })
      },
    })
  }

  // Отправка отклика
  const useCreateBid = () => {
    return useMutation({
      mutationFn: async ({ orderId, bidData }: { orderId: string; bidData: BidFormData }) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Необходима авторизация')

        const { data, error } = await supabase
          .from('bids')
          .insert([
            {
              order_id: orderId,
              executor_id: user.id,
              ...bidData,
              status: 'pending',
            },
          ])
          .select()
          .single()

        if (error) throw error
        return data as Bid
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bids'] })
        toast({
          title: 'Отклик отправлен',
          description: 'Ваш отклик успешно отправлен заказчику',
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Ошибка',
          description: error.message || 'Не удалось отправить отклик',
          variant: 'destructive',
        })
      },
    })
  }

  // Принятие/отклонение отклика
  const useUpdateBidStatus = () => {
    return useMutation({
      mutationFn: async ({ bidId, status }: { bidId: string; status: 'accepted' | 'rejected' }) => {
        const { data, error } = await supabase
          .from('bids')
          .update({ status })
          .eq('id', bidId)
          .select()
          .single()

        if (error) throw error

        // Если отклик принят, обновляем заказ
        if (status === 'accepted') {
          const bid = data as Bid
          await supabase
            .from('orders')
            .update({ 
              status: 'in_progress',
              executor_id: bid.executor_id 
            })
            .eq('id', bid.order_id)
        }

        return data as Bid
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['bids'] })
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        toast({
          title: variables.status === 'accepted' ? 'Отклик принят' : 'Отклик отклонен',
          description: variables.status === 'accepted' 
            ? 'Исполнитель выбран для выполнения заказа' 
            : 'Отклик отклонен',
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Ошибка',
          description: error.message || 'Не удалось обновить статус отклика',
          variant: 'destructive',
        })
      },
    })
  }

  // Получение откликов пользователя
  const useGetUserBids = () => {
    const { user } = useAuth()
    
    return useQuery({
      queryKey: ['user-bids', user?.id],
      queryFn: async () => {
        if (!user) return []

        const { data, error } = await supabase
          .from('bids')
          .select('*, orders(*, profiles!orders_customer_id_fkey(*))')
          .eq('executor_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        return data as (Bid & { orders: Order })[]
      },
      enabled: !!user,
    })
  }

  return {
    useGetOrders,
    useGetOrder,
    useCreateOrder,
    useUpdateOrder,
    useDeleteOrder,
    usePublishOrder,
    useCreateBid,
    useUpdateBidStatus,
    useGetUserBids,
  }
}