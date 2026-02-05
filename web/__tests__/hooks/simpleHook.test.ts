const useCounter = (initialValue = 0) => {
  let count = initialValue;
  
  const increment = () => {
    count += 1;
    return count;
  };
  
  const decrement = () => {
    count -= 1;
    return count;
  };
  
  return { count, increment, decrement };
};

describe('useCounter hook', () => {
  it('should initialize with default value', () => {
    const counter = useCounter();
    expect(counter.count).toBe(0);
  });

  it('should initialize with custom value', () => {
    const counter = useCounter(5);
    expect(counter.count).toBe(5);
  });

  it('should increment', () => {
    const counter = useCounter(0);
    const newCount = counter.increment();
    expect(newCount).toBe(1);
  });

  it('should decrement', () => {
    const counter = useCounter(5);
    const newCount = counter.decrement();
    expect(newCount).toBe(4);
  });
});