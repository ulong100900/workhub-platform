describe('Web Application Tests', () => {
  test('basic math', () => {
    expect(1 + 1).toBe(2);
    expect(5 * 5).toBe(25);
  });

  test('string operations', () => {
    expect('hello').toBe('hello');
    expect('test').toHaveLength(4);
  });

  test('array operations', () => {
    const arr = [1, 2, 3];
    expect(arr).toContain(2);
    expect(arr.length).toBe(3);
  });
});