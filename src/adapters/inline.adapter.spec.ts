import { InlineAdapter } from './inline.adapter';

describe('InlineAdapter', () => {
  const adapter = new InlineAdapter();

  it('converts simple properties', () => {
    const schema = adapter.convert({
      name: { type: 'string', description: 'User name' },
      age: { type: 'number' },
    });

    expect(schema.type).toBe('object');
    expect(schema.properties.name).toEqual({ type: 'string', description: 'User name' });
    expect(schema.properties.age).toEqual({ type: 'number' });
    expect(schema.required).toEqual(['name', 'age']);
  });

  it('handles optional properties', () => {
    const schema = adapter.convert({
      name: { type: 'string' },
      nickname: { type: 'string', required: false },
    });

    expect(schema.required).toEqual(['name']);
  });

  it('handles enum properties', () => {
    const schema = adapter.convert({
      status: { type: 'string', enum: ['active', 'inactive'] },
    });

    expect(schema.properties.status.enum).toEqual(['active', 'inactive']);
  });

  it('handles array properties with items', () => {
    const schema = adapter.convert({
      tags: { type: 'array', items: { type: 'string' } },
    });

    expect(schema.properties.tags).toEqual({ type: 'array', items: { type: 'string' } });
  });

  it('handles default values', () => {
    const schema = adapter.convert({
      limit: { type: 'number', default: 10 },
    });

    expect(schema.properties.limit.default).toBe(10);
  });

  it('returns empty required when all optional', () => {
    const schema = adapter.convert({
      a: { type: 'string', required: false },
      b: { type: 'number', required: false },
    });

    expect(schema.required).toBeUndefined();
  });
});
