// web/lib/api/bids.ts - PRODUCTION READY
import { Bid, CreateBidDTO, UpdateBidDTO, BidStats, BidFilters } from '@/types/bids';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const fetchWithAuth = async (input: RequestInfo, init?: RequestInit) => {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('access_token')
    : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...init?.headers,
  };

  const response = await fetch(`${API_BASE_URL}${input}`, {
    ...init,
    headers,
    credentials: 'include', // Для куков, если используется
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    throw new ApiError(
      response.status,
      errorData.message || 'API request failed',
      errorData.code
    );
  }

  return response;
};

export const bidsApi = {
  // Проверка возможности отправки предложения
  async canSubmitBid(projectId: string): Promise<{ canSubmit: boolean; reason?: string }> {
    try {
      const response = await fetchWithAuth(`/bids/can-submit/${projectId}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to check bid eligibility:', error);
      return { canSubmit: false, reason: 'Connection error' };
    }
  },

  // Отправка предложения
  async submitBid(bidData: CreateBidDTO): Promise<Bid> {
    const response = await fetchWithAuth('/bids', {
      method: 'POST',
      body: JSON.stringify(bidData),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new ApiError(response.status, result.message, result.error);
    }
    
    return result.data;
  },

  // Получение предложений по проекту
  async getProjectBids(
    projectId: string, 
    filters?: BidFilters
  ): Promise<{ bids: Bid[]; total: number }> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = `/bids/project/${projectId}${
      queryParams.toString() ? `?${queryParams}` : ''
    }`;

    const response = await fetchWithAuth(url);
    const result = await response.json();
    
    return result.data || { bids: [], total: 0 };
  },

  // Получение предложений исполнителя
  async getFreelancerBids(
    freelancerId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ bids: Bid[]; total: number; page: number; totalPages: number }> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (freelancerId) {
      queryParams.append('freelancerId', freelancerId);
    }

    const url = `/bids/freelancer?${queryParams}`;
    const response = await fetchWithAuth(url);
    const result = await response.json();
    
    return result.data || { bids: [], total: 0, page: 1, totalPages: 1 };
  },

  // Получение статистики предложений
  async getBidStats(projectId: string): Promise<BidStats> {
    const response = await fetchWithAuth(`/bids/stats/${projectId}`);
    const result = await response.json();
    
    return result.data || {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      avg_amount: 0,
    };
  },

  // Принятие предложения
  async acceptBid(bidId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithAuth(`/bids/${bidId}/accept`, {
      method: 'POST',
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new ApiError(response.status, result.message, result.error);
    }
    
    return result.data;
  },

  // Отзыв предложения
  async withdrawBid(bidId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetchWithAuth(`/bids/${bidId}/withdraw`, {
      method: 'POST',
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new ApiError(response.status, result.message, result.error);
    }
    
    return result.data;
  },

  // Обновление предложения
  async updateBid(bidId: string, updates: UpdateBidDTO): Promise<Bid> {
    const response = await fetchWithAuth(`/bids/${bidId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new ApiError(response.status, result.message, result.error);
    }
    
    return result.data;
  },

  // Получение предложения по ID
  async getBidById(bidId: string): Promise<Bid | null> {
    try {
      const response = await fetchWithAuth(`/bids/${bidId}`);
      const result = await response.json();
      
      if (!result.success) {
        return null;
      }
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch bid:', error);
      return null;
    }
  },

  // Получение моих предложений (текущего пользователя)
  async getMyBids(
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ bids: Bid[]; total: number }> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      queryParams.append('status', status);
    }

    const url = `/bids/my?${queryParams}`;
    const response = await fetchWithAuth(url);
    const result = await response.json();
    
    return result.data || { bids: [], total: 0 };
  },

  // Поиск предложений
  async searchBids(
    query: string,
    filters?: BidFilters
  ): Promise<{ bids: Bid[]; total: number }> {
    const queryParams = new URLSearchParams({ q: query });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = `/bids/search?${queryParams}`;
    const response = await fetchWithAuth(url);
    const result = await response.json();
    
    return result.data || { bids: [], total: 0 };
  },
};

// Хук для React компонентов
export const useBidsApi = () => {
  return bidsApi;
};

export default bidsApi;