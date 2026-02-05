// lib/calendar.ts
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  type: 'order' | 'meeting' | 'block' | 'personal';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  orderId?: string;
  customerId?: string;
  executorId?: string;
  color?: string;
  location?: string;
  notes?: string;
  projectId?: string;
}

export class CalendarService {
  static getEventColor(type: CalendarEvent['type']): string {
    const colors = {
      order: '#3b82f6', // синий
      meeting: '#8b5cf6', // фиолетовый
      block: '#6b7280', // серый
      personal: '#10b981', // зеленый
    };
    return colors[type];
  }

  static getEventIcon(type: CalendarEvent['type']): string {
    const icons = {
      order: '🏗️',
      meeting: '👥',
      block: '⏸️',
      personal: '👤',
    };
    return icons[type];
  }

  static getStatusText(status: CalendarEvent['status']): string {
    const statuses = {
      pending: 'Ожидает',
      confirmed: 'Подтверждено',
      completed: 'Завершено',
      cancelled: 'Отменено',
    };
    return statuses[status];
  }

  static getTypeText(type: CalendarEvent['type']): string {
    const types = {
      order: 'Заказ',
      meeting: 'Встреча',
      block: 'Блокировка',
      personal: 'Личное',
    };
    return types[type];
  }

  // Генерация тестовых данных
  static generateMockEvents(month: Date = new Date()): CalendarEvent[] {
    const currentYear = month.getFullYear();
    const currentMonth = month.getMonth();
    
    return [
      {
        id: '1',
        title: 'Выкопать котлован',
        description: 'Котлован 10x15м для фундамента жилого дома',
        start: new Date(currentYear, currentMonth, 15, 9, 0),
        end: new Date(currentYear, currentMonth, 15, 18, 0),
        type: 'order',
        status: 'confirmed',
        orderId: 'ORD-001',
        customerId: 'c1',
        executorId: 'e1',
        color: this.getEventColor('order'),
        location: 'ул. Ленина, 123, стр. 1',
        projectId: 'PROJ-001'
      },
      {
        id: '2',
        title: 'Встреча с клиентом',
        description: 'Обсуждение деталей проекта "ЖК Солнечный"',
        start: new Date(currentYear, currentMonth, 16, 14, 0),
        end: new Date(currentYear, currentMonth, 16, 15, 30),
        type: 'meeting',
        status: 'pending',
        executorId: 'e1',
        color: this.getEventColor('meeting'),
        location: 'Офис клиента, ул. Центральная, 45',
        projectId: 'PROJ-002'
      },
      {
        id: '3',
        title: 'Техническое обслуживание',
        description: 'Плановый ТО экскаватора CAT 320',
        start: new Date(currentYear, currentMonth, 17, 10, 0),
        end: new Date(currentYear, currentMonth, 17, 12, 0),
        type: 'block',
        status: 'confirmed',
        executorId: 'e1',
        color: this.getEventColor('block'),
        location: 'Сервисный центр ТЕХНО',
        notes: 'Запчасти уже заказаны'
      },
      {
        id: '4',
        title: 'Планерное совещание',
        description: 'Еженедельное совещание с бригадой',
        start: new Date(currentYear, currentMonth, 18, 8, 30),
        end: new Date(currentYear, currentMonth, 18, 9, 30),
        type: 'meeting',
        status: 'confirmed',
        executorId: 'e1',
        color: this.getEventColor('meeting'),
        location: 'Офис WorkFinder'
      },
      {
        id: '5',
        title: 'Завершение работ по объекту',
        description: 'Сдача объекта "Складской комплекс"',
        start: new Date(currentYear, currentMonth, 20, 16, 0),
        end: new Date(currentYear, currentMonth, 20, 17, 0),
        type: 'order',
        status: 'completed',
        orderId: 'ORD-002',
        customerId: 'c2',
        executorId: 'e1',
        color: '#10b981', // зеленый для завершенных
        location: 'ул. Промышленная, 78'
      },
      {
        id: '6',
        title: 'Обед с партнерами',
        description: 'Неформальная встреча',
        start: new Date(currentYear, currentMonth, 22, 13, 0),
        end: new Date(currentYear, currentMonth, 22, 15, 0),
        type: 'personal',
        status: 'confirmed',
        color: this.getEventColor('personal'),
        location: 'Ресторан "Уют"'
      }
    ];
  }
}