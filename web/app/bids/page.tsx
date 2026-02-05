// app/bids/page.tsx
import { Suspense } from 'react';
import { Metadata } from 'next';
import PublicBidsPage from '@/components/bids/PublicBidsPage';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Заявки на проекты | WorkFinder',
  description: 'Просмотр всех заявок на проекты платформы WorkFinder',
};

export default function BidsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Заявки на проекты</h1>
        <p className="text-muted-foreground mt-2">
          Просмотр всех заявок от фрилансеров на различные проекты
        </p>
      </div>

      <Suspense fallback={<BidsPageSkeleton />}>
        <PublicBidsPage />
      </Suspense>
    </div>
  );
}

function BidsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  );
}