describe('Server Tests', () => {
  test('server math operations', () => {
    expect(10 + 20).toBe(30);
    expect(100 / 10).toBe(10);
  });

  test('server string validation', () => {
    const isValidEmail = (email: string) => {
      return email.includes('@') && email.includes('.');
    };

    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });
});