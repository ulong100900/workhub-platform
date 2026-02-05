// web/src/components/bids/SubmitBidModal.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { bidService } from '@/services/bids';
import { Loader2, Send, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubmitBidModalProps {
  projectId: string;
  projectTitle: string;
  projectBudget: number;
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function SubmitBidModal({
  projectId,
  projectTitle,
  projectBudget,
  children,
  onSuccess,
}: SubmitBidModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [canBid, setCanBid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    amount: Math.round(projectBudget * 0.9),
    delivery_days: 7,
    cover_letter: '',
  });

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    
    if (isOpen) {
      setChecking(true);
      setError(null);
      try {
        const eligible = await bidService.canSubmitBid(projectId);
        setCanBid(eligible);
        if (!eligible) {
          setError('Вы не можете отправить предложение на этот проект');
        }
      } catch (err: any) {
        setError(err.message);
        setCanBid(false);
      } finally {
        setChecking(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cover_letter.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Напишите сопроводительное письмо',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await bidService.submitBid({
        project_id: projectId,
        ...formData,
      });

      toast({
        title: 'Успешно!',
        description: 'Ваше предложение отправлено',
      });

      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Отправить предложение</DialogTitle>
          <DialogDescription>
            Проект: "{projectTitle}"
          </DialogDescription>
        </DialogHeader>

        {checking ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Проверка возможности...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        ) : !canBid ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Вы не можете отправить предложение на этот проект
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Бюджет проекта */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Бюджет проекта</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(projectBudget)} ₽
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Средняя цена предложений: {formatCurrency(projectBudget * 0.85)} ₽
              </div>
            </div>

            {/* Сумма предложения */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label htmlFor="amount">Сумма предложения (₽)</Label>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(formData.amount)} ₽
                </span>
              </div>
              <Slider
                id="amount"
                min={projectBudget * 0.5}
                max={projectBudget * 1.5}
                step={1000}
                value={[formData.amount]}
                onValueChange={([value]) => 
                  setFormData(prev => ({ ...prev, amount: value }))
                }
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatCurrency(projectBudget * 0.5)} ₽</span>
                <span>Бюджет: {formatCurrency(projectBudget)} ₽</span>
                <span>{formatCurrency(projectBudget * 1.5)} ₽</span>
              </div>
              {formData.amount > projectBudget && (
                <div className="text-sm text-amber-600">
                  ⚠️ Ваша цена выше бюджета проекта
                </div>
              )}
            </div>

            {/* Срок выполнения */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label htmlFor="delivery_days">Срок выполнения (дней)</Label>
                <span className="text-lg font-medium">{formData.delivery_days} дней</span>
              </div>
              <Slider
                id="delivery_days"
                min={1}
                max={30}
                step={1}
                value={[formData.delivery_days]}
                onValueChange={([value]) => 
                  setFormData(prev => ({ ...prev, delivery_days: value }))
                }
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1 день</span>
                <span>15 дней</span>
                <span>30 дней</span>
              </div>
            </div>

            {/* Сопроводительное письмо */}
            <div className="space-y-2">
              <Label htmlFor="cover_letter">
                Сопроводительное письмо <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cover_letter"
                placeholder="Расскажите, почему вы подходите для этого проекта, ваш опыт и подход к работе..."
                value={formData.cover_letter}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, cover_letter: e.target.value }))
                }
                rows={6}
                className="min-h-[120px]"
                required
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Минимум 50 символов</span>
                <span className={formData.cover_letter.length < 50 ? 'text-destructive' : ''}>
                  {formData.cover_letter.length} / 50
                </span>
              </div>
            </div>

            {/* Советы */}
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-medium">Советы для успешного предложения:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Укажите конкретные сроки и детали выполнения</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Опишите ваш опыт в подобных проектах</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Предложите оптимальную цену за качественную работу</span>
                </li>
              </ul>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button 
                type="submit" 
                disabled={loading || formData.cover_letter.length < 50}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Отправить предложение
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}