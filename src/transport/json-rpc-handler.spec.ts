import { JsonRpcHandler } from './json-rpc-handler';
import { ToolRegistryService } from '../registry/tool-registry.service';

describe('JsonRpcHandler', () => {
  let registry: ToolRegistryService;
  let handler: JsonRpcHandler;

  beforeEach(() => {
    registry = new ToolRegistryService();
    handler = new JsonRpcHandler(registry, { name: 'test-server', version: '1.0.0' });
  });

  it('handles initialize', async () => {
    const result = await handler.handle(
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
      'session1',
    );

    expect(result.result.serverInfo.name).toBe('test-server');
    expect(result.result.serverInfo.version).toBe('1.0.0');
    expect(result.result.protocolVersion).toBe('2024-11-05');
    expect(result.result.capabilities.tools).toBeDefined();
  });

  it('handles tools/list', async () => {
    registry.registerTool({
      definition: { name: 'my_tool', description: 'Test', inputSchema: { type: 'object', properties: {} } },
      handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
    });

    const result = await handler.handle(
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      'session1',
    );

    expect(result.result.tools).toHaveLength(1);
    expect(result.result.tools[0].name).toBe('my_tool');
  });

  it('handles tools/call', async () => {
    registry.registerTool({
      definition: { name: 'echo', description: 'Echo', inputSchema: { type: 'object', properties: {} } },
      handler: async (args) => ({ content: [{ type: 'text', text: args.msg }] }),
    });

    const result = await handler.handle(
      { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'echo', arguments: { msg: 'hi' } } },
      'session1',
    );

    expect(result.result.content[0].text).toBe('hi');
  });

  it('handles resources/list', async () => {
    registry.registerResource({
      definition: { uri: 'test://resource', name: 'test_resource' },
      handler: async () => ({ contents: [{ uri: 'test://resource', text: 'data' }] }),
    });

    const result = await handler.handle(
      { jsonrpc: '2.0', id: 4, method: 'resources/list' },
      'session1',
    );

    expect(result.result.resources).toHaveLength(1);
  });

  it('handles resources/templates/list', async () => {
    registry.registerResource({
      definition: { uriTemplate: 'test://{id}', name: 'test_template' },
      handler: async () => ({ contents: [] }),
    });

    const result = await handler.handle(
      { jsonrpc: '2.0', id: 5, method: 'resources/templates/list' },
      'session1',
    );

    expect(result.result.resourceTemplates).toHaveLength(1);
  });

  it('handles prompts/list', async () => {
    registry.registerPrompt({
      definition: { name: 'my_prompt', description: 'Test prompt' },
      handler: async () => ({ messages: [] }),
    });

    const result = await handler.handle(
      { jsonrpc: '2.0', id: 6, method: 'prompts/list' },
      'session1',
    );

    expect(result.result.prompts).toHaveLength(1);
  });

  it('handles prompts/get', async () => {
    registry.registerPrompt({
      definition: { name: 'greet', description: 'Greet' },
      handler: async (args) => ({
        messages: [{ role: 'user', content: { type: 'text', text: `Hello ${args.name}` } }],
      }),
    });

    const result = await handler.handle(
      { jsonrpc: '2.0', id: 7, method: 'prompts/get', params: { name: 'greet', arguments: { name: 'World' } } },
      'session1',
    );

    expect(result.result.messages[0].content.text).toBe('Hello World');
  });

  it('handles ping', async () => {
    const result = await handler.handle(
      { jsonrpc: '2.0', id: 8, method: 'ping' },
      'session1',
    );

    expect(result.result).toEqual({});
  });

  it('returns method not found for unknown methods', async () => {
    const result = await handler.handle(
      { jsonrpc: '2.0', id: 9, method: 'unknown/method' },
      'session1',
    );

    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe(-32601);
  });

  it('returns error on handler exceptions', async () => {
    registry.registerResource({
      definition: { uri: 'bad://resource', name: 'bad' },
      handler: async () => { throw new Error('resource failed'); },
    });

    const result = await handler.handle(
      { jsonrpc: '2.0', id: 10, method: 'resources/read', params: { uri: 'bad://resource' } },
      'session1',
    );

    expect(result.error).toBeDefined();
    expect(result.error!.code).toBe(-32603);
  });
});
