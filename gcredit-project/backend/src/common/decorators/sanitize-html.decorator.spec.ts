import { plainToInstance } from 'class-transformer';
import { SanitizeHtml } from './sanitize-html.decorator';

class TestDto {
  @SanitizeHtml()
  name: string;

  @SanitizeHtml()
  description?: string;
}

describe('SanitizeHtml Decorator', () => {
  it('should preserve plain text', () => {
    const result = plainToInstance(TestDto, { name: 'Hello World' });
    expect(result.name).toBe('Hello World');
  });

  it('should strip script tags', () => {
    const result = plainToInstance(TestDto, {
      name: '<script>alert("xss")</script>',
    });
    expect(result.name).toBe('');
  });

  it('should strip bold tags but keep text', () => {
    const result = plainToInstance(TestDto, { name: '<b>Bold</b> text' });
    expect(result.name).toBe('Bold text');
  });

  it('should strip img tags with onerror', () => {
    const result = plainToInstance(TestDto, {
      name: '<img src="x" onerror="alert(1)">',
    });
    expect(result.name).toBe('');
  });

  it('should trim whitespace', () => {
    const result = plainToInstance(TestDto, { name: '  spaces  ' });
    expect(result.name).toBe('spaces');
  });

  it('should pass through null', () => {
    const result = plainToInstance(TestDto, { name: null });
    expect(result.name).toBeNull();
  });

  it('should pass through undefined', () => {
    const result = plainToInstance(TestDto, {});
    expect(result.description).toBeUndefined();
  });

  it('should pass through numbers', () => {
    const result = plainToInstance(TestDto, { name: 42 });
    expect(result.name).toBe(42);
  });

  it('should strip nested HTML tags', () => {
    const result = plainToInstance(TestDto, {
      name: '<div><script>x</script></div>',
    });
    expect(result.name).toBe('');
  });

  it('should handle HTML entities correctly', () => {
    const result = plainToInstance(TestDto, { name: '&lt;script&gt;' });
    expect(result.name).toBe('&lt;script&gt;');
  });

  it('should strip event handler attributes', () => {
    const result = plainToInstance(TestDto, {
      name: '<a href="javascript:alert(1)">click</a>',
    });
    expect(result.name).toBe('click');
  });
});
