import { PlaygroundController } from './playground.controller';
import { ToolRegistryService } from '../registry/tool-registry.service';
import { SessionManagerService } from '../transport/session-manager.service';
import { McpModuleOptions } from '../interfaces/module-options.interfaces';

describe('PlaygroundController', () => {
  let controller: PlaygroundController;
  let registry: ToolRegistryService;
  let sessionManager: SessionManagerService;
  const options: McpModuleOptions = {
    name: 'test-server',
    version: '1.0.0',
    playground: true,
  };

  beforeEach(() => {
    registry = new ToolRegistryService();
    sessionManager = new SessionManagerService();
    sessionManager.configure({ cleanupInterval: 60000 });
    controller = new PlaygroundController(registry, sessionManager, options);
  });

  afterEach(() => {
    sessionManager.onModuleDestroy();
  });

  it('serves playground HTML', () => {
    const res = {
      type: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    controller.servePlayground(res as any);

    expect(res.type).toHaveBeenCalledWith('text/html');
    expect(res.send).toHaveBeenCalled();
    const html = res.send.mock.calls[0][0];
    expect(html).toContain('test-server');
    expect(html).toContain('1.0.0');
    expect(html).toContain('MCP Playground');
  });

  it('returns server info', () => {
    const info = controller.getServerInfo();
    expect(info.name).toBe('test-server');
    expect(info.version).toBe('1.0.0');
    expect(info.sessions).toBe(0);
  });

  it('lists tools', () => {
    registry.registerTool({
      definition: { name: 'my_tool', description: 'Test', inputSchema: { type: 'object', properties: {} } },
      handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
    });

    const tools = controller.listTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('my_tool');
  });

  it('lists resources', () => {
    registry.registerResource({
      definition: { uri: 'test://res', name: 'test_res' },
      handler: async () => ({ contents: [] }),
    });

    const resources = controller.listResources();
    expect(resources).toHaveLength(1);
  });

  it('lists prompts', () => {
    registry.registerPrompt({
      definition: { name: 'my_prompt' },
      handler: async () => ({ messages: [] }),
    });

    const prompts = controller.listPrompts();
    expect(prompts).toHaveLength(1);
  });

  it('calls a tool and returns result', async () => {
    registry.registerTool({
      definition: { name: 'echo', description: 'Echo', inputSchema: { type: 'object', properties: {} } },
      handler: async (args) => ({ content: [{ type: 'text', text: args.message }] }),
    });

    const result = await controller.callTool({ name: 'echo', arguments: { message: 'hello' } });
    expect(result.content[0].text).toBe('hello');
    // Session should be cleaned up
    expect(sessionManager.getSessionCount()).toBe(0);
  });

  it('reads a resource', async () => {
    registry.registerResource({
      definition: { uri: 'test://data', name: 'data' },
      handler: async () => ({ contents: [{ uri: 'test://data', text: '{"ok":true}' }] }),
    });

    const result = await controller.readResource({ uri: 'test://data' });
    expect(result.contents[0].text).toBe('{"ok":true}');
  });

  it('gets a prompt', async () => {
    registry.registerPrompt({
      definition: { name: 'greet' },
      handler: async (args) => ({
        messages: [{ role: 'user', content: { type: 'text', text: `Hi ${args.name}` } }],
      }),
    });

    const result = await controller.getPrompt({ name: 'greet', arguments: { name: 'World' } });
    expect(result.messages[0].content.text).toBe('Hi World');
  });

  it('cleans up session even on tool error', async () => {
    registry.registerTool({
      definition: { name: 'bad', description: 'Fails', inputSchema: { type: 'object', properties: {} } },
      handler: async () => { throw new Error('boom'); },
    });

    // executeTool in registry catches errors, so this should still succeed
    const result = await controller.callTool({ name: 'bad', arguments: {} });
    expect(result.isError).toBe(true);
    expect(sessionManager.getSessionCount()).toBe(0);
  });
});
