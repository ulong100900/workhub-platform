// web/src/types/bids.ts
export interface Bid {
  id: string;
  project_id: string;
  freelancer_id: string;
  amount: number;
  delivery_days: number;
  cover_letter: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
  updated_at: string;
  
  // Расширенные поля
  freelancer?: {
    id: string;
    full_name: string;
    avatar_url: string;
    rating: number;
    completed_projects: number;
    specialization: string;
  };
  project?: {
    id: string;
    title: string;
    budget: number;
    status: string;
    client_id: string;
  };
}

export interface CreateBidDTO {
  project_id: string;
  amount: number;
  delivery_days: number;
  cover_letter: string;
}

export interface UpdateBidDTO {
  amount?: number;
  delivery_days?: number;
  cover_letter?: string;
}

export interface BidStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  avg_amount: number;
}

export interface BidFilters {
  status?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: 'amount' | 'delivery_days' | 'created_at' | 'rating';
  sort_order?: 'asc' | 'desc';
}