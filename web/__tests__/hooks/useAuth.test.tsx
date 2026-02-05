import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';

// Мок для fetch/API
global.fetch = jest.fn();

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with null user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('should login successfully', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser, token: 'fake-token' })
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.user).toEqual(mockUser);
  });
});