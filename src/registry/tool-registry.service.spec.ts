import { ToolRegistryService } from './tool-registry.service';

describe('ToolRegistryService', () => {
  let registry: ToolRegistryService;

  beforeEach(() => {
    registry = new ToolRegistryService();
  });

  it('registers and lists tools', () => {
    registry.registerTool({
      definition: {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: { type: 'object', properties: { input: { type: 'string' } } },
      },
      handler: async (args) => ({ content: [{ type: 'text', text: args.input }] }),
    });

    const definitions = registry.getToolDefinitions();
    expect(definitions).toHaveLength(1);
    expect(definitions[0].name).toBe('test_tool');
    expect(registry.getToolCount()).toBe(1);
  });

  it('executes a tool', async () => {
    registry.registerTool({
      definition: {
        name: 'echo',
        description: 'Echo input',
        inputSchema: { type: 'object', properties: { message: { type: 'string' } } },
      },
      handler: async (args) => ({ content: [{ type: 'text', text: args.message }] }),
    });

    const result = await registry.executeTool('echo', { message: 'hello' }, 'session1');
    expect(result.content[0].text).toBe('hello');
    expect(result.isError).toBeUndefined();
  });

  it('returns error for unknown tool', async () => {
    const result = await registry.executeTool('nonexistent', {}, 'session1');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Unknown tool');
  });

  it('catches handler errors', async () => {
    registry.registerTool({
      definition: {
        name: 'failing',
        description: 'Fails',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () => { throw new Error('boom'); },
    });

    const result = await registry.executeTool('failing', {}, 'session1');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('boom');
  });

  it('registers many tools at once', () => {
    registry.registerMany([
      {
        definition: { name: 'tool1', description: 'T1', inputSchema: { type: 'object', properties: {} } },
        handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      },
      {
        definition: { name: 'tool2', description: 'T2', inputSchema: { type: 'object', properties: {} } },
        handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      },
    ]);

    expect(registry.getToolCount()).toBe(2);
  });

  it('registers and lists resources', () => {
    registry.registerResource({
      definition: { uri: 'users://list', name: 'users_list', description: 'List users' },
      handler: async () => ({ contents: [{ uri: 'users://list', text: '[]' }] }),
    });

    expect(registry.getResourceDefinitions()).toHaveLength(1);
    expect(registry.getResourceCount()).toBe(1);
  });

  it('executes a resource', async () => {
    registry.registerResource({
      definition: { uri: 'users://list', name: 'users_list' },
      handler: async () => ({ contents: [{ uri: 'users://list', text: '[{"id":1}]' }] }),
    });

    const result = await registry.executeResource('users://list', 'session1');
    expect(result.contents[0].text).toBe('[{"id":1}]');
  });

  it('matches resource templates', async () => {
    registry.registerResource({
      definition: { uriTemplate: 'users://{userId}', name: 'user_detail' },
      handler: async (uri) => ({ contents: [{ uri, text: 'found' }] }),
    });

    const result = await registry.executeResource('users://123', 'session1');
    expect(result.contents[0].text).toBe('found');
  });

  it('registers and executes prompts', async () => {
    registry.registerPrompt({
      definition: { name: 'summarize', description: 'Summarize text' },
      handler: async (args) => ({
        messages: [{ role: 'user', content: { type: 'text', text: `Summarize: ${args.text}` } }],
      }),
    });

    expect(registry.getPromptDefinitions()).toHaveLength(1);
    const result = await registry.executePrompt('summarize', { text: 'hello world' }, 'session1');
    expect(result.messages[0].content.text).toContain('hello world');
  });

  it('throws for unknown resource', async () => {
    await expect(registry.executeResource('unknown://x', 'session1')).rejects.toThrow('Unknown resource');
  });

  it('throws for unknown prompt', async () => {
    await expect(registry.executePrompt('unknown', {}, 'session1')).rejects.toThrow('Unknown prompt');
  });
});
