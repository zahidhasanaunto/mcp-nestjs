import { McpExecutionContextImpl } from './mcp-execution-context';

describe('McpExecutionContextImpl', () => {
  it('returns all context values', () => {
    const ctx = new McpExecutionContextImpl(
      'session-123',
      { key: 'value' },
      { headers: {} },
      'my_tool',
      'tool',
    );

    expect(ctx.getSessionId()).toBe('session-123');
    expect(ctx.getArgs()).toEqual({ key: 'value' });
    expect(ctx.getRequest()).toEqual({ headers: {} });
    expect(ctx.getToolName()).toBe('my_tool');
    expect(ctx.getType()).toBe('tool');
  });
});
