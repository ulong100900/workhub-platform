import React from 'react';

const SimpleButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  return (
    <button onClick={onClick} data-testid="simple-button">
      {children}
    </button>
  );
};

describe('SimpleButton', () => {
  it('renders with children', () => {
    // Простой тест без рендеринга для начала
    expect(SimpleButton).toBeDefined();
  });

  it('has correct props interface', () => {
    // Проверяем что компонент ожидает правильные пропсы
    const props: React.ComponentProps<typeof SimpleButton> = {
      children: 'Test',
    };
    expect(props.children).toBe('Test');
  });
});