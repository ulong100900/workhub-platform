describe('Web Application', () => {
  test('basic assertions', () => {
    expect(true).toBe(true);
    expect(1).toBe(1);
    expect('hello').toBe('hello');
  });

  test('array operations', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers.length).toBe(5);
    expect(numbers).toContain(3);
  });
});