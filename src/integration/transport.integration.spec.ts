import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Injectable } from '@nestjs/common';
import { McpModule } from '../mcp.module';
import { McpTool } from '../decorators/mcp-tool.decorator';
import { McpResource } from '../decorators/mcp-resource.decorator';
import { McpPrompt } from '../decorators/mcp-prompt.decorator';
import request from 'supertest';

// ─── Test Services ────────────────────────────────────────────────

@Injectable()
class ToolService {
  @McpTool({
    description: 'Add two numbers',
    schema: {
      a: { type: 'number', description: 'First number' },
      b: { type: 'number', description: 'Second number' },
    },
  })
  async add(args: { a: number; b: number }) {
    return { sum: args.a + args.b };
  }
}

@Injectable()
class ResourceService {
  @McpResource({
    uri: 'config://app',
    name: 'app_config',
    description: 'Application config',
    mimeType: 'application/json',
  })
  async getConfig() {
    return {
      contents: [{ uri: 'config://app', mimeType: 'application/json', text: '{"env":"test"}' }],
    };
  }

  @McpResource({
    uriTemplate: 'users://{id}',
    name: 'user',
    description: 'Get user by ID',
  })
  async getUser(uri: string) {
    const id = uri.split('://')[1];
    return { contents: [{ uri, text: JSON.stringify({ id }) }] };
  }
}

@Injectable()
class PromptService {
  @McpPrompt({
    name: 'summarize',
    description: 'Summarize text',
    schema: {
      text: { type: 'string', description: 'Text to summarize' },
    },
  })
  async summarize(args: { text: string }) {
    return {
      messages: [{ role: 'user' as const, content: { type: 'text' as const, text: `Summarize: ${args.text}` } }],
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

let hasSupertest = false;
try {
  require.resolve('supertest');
  hasSupertest = true;
} catch {}

// ─── SSE Transport Tests ──────────────────────────────────────────

(hasSupertest ? describe : describe.skip)('SSE Transport Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        McpModule.forRoot({
          name: 'sse-test',
          version: '1.0.0',
          transports: { sse: { enabled: true } },
          playground: true,
        }),
      ],
      providers: [ToolService, ResourceService, PromptService],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('establishes SSE connection and returns endpoint', async () => {
    const res = await request(app.getHttpServer())
      .get('/sse')
      .buffer(true)
      .parse((res: any, callback: any) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
          // Close after first event
          res.destroy();
        });
        res.on('end', () => callback(null, data));
        res.on('error', () => callback(null, data));
        res.on('close', () => callback(null, data));
      });

    expect(res.body).toContain('event: endpoint');
    expect(res.body).toContain('/messages?sessionId=');
  });

  it('rejects messages without sessionId', async () => {
    const res = await request(app.getHttpServer())
      .post('/messages')
      .send({ jsonrpc: '2.0', id: 1, method: 'ping' });

    expect(res.status).toBe(400);
  });

  it('rejects messages with invalid sessionId', async () => {
    const res = await request(app.getHttpServer())
      .post('/messages?sessionId=invalid')
      .send({ jsonrpc: '2.0', id: 1, method: 'ping' });

    expect(res.status).toBe(404);
  });
});

// ─── Streamable HTTP Transport Tests ──────────────────────────────

(hasSupertest ? describe : describe.skip)('Streamable HTTP Transport Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        McpModule.forRoot({
          name: 'http-test',
          version: '1.0.0',
          transports: { http: { enabled: true } },
        }),
      ],
      providers: [ToolService, ResourceService, PromptService],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('handles initialize request', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp')
      .send({ jsonrpc: '2.0', id: 1, method: 'initialize' });

    expect(res.status).toBe(200);
    expect(res.body.jsonrpc).toBe('2.0');
    expect(res.body.result.protocolVersion).toBe('2024-11-05');
    expect(res.body.result.serverInfo.name).toBe('http-test');
    expect(res.body.result.serverInfo.version).toBe('1.0.0');
    expect(res.headers['mcp-session-id']).toBeDefined();
  });

  it('handles ping', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp')
      .send({ jsonrpc: '2.0', id: 2, method: 'ping' });

    expect(res.status).toBe(200);
    expect(res.body.result).toEqual({});
  });

  it('lists auto-discovered tools', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp')
      .send({ jsonrpc: '2.0', id: 3, method: 'tools/list' });

    expect(res.status).toBe(200);
    const tools = res.body.result.tools;
    expect(tools).toBeInstanceOf(Array);
    expect(tools.some((t: any) => t.name === 'add')).toBe(true);
    expect(tools[0].inputSchema).toBeDefined();
  });

  it('calls an auto-discovered tool', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp')
      .send({
        jsonrpc: '2.0', id: 4, method: 'tools/call',
        params: { name: 'add', arguments: { a: 10, b: 20 } },
      });

    expect(res.status).toBe(200);
    expect(res.body.result.isError).toBeFalsy();
    const parsed = JSON.parse(res.body.result.content[0].text);
    expect(parsed.sum).toBe(30);
  });

  it('returns error for unknown tool call', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp')
      .send({
        jsonrpc: '2.0', id: 5, method: 'tools/call',
        params: { name: 'nonexistent', arguments: {} },
      });

    expect(res.status).toBe(200);
    expect(res.body.result.isError).toBe(true);
    expect(res.body.result.content[0].text).toContain('Unknown tool');
  });

  it('lists auto-discovered resources', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp')
      .send({ jsonrpc: '2.0', id: 6, method: 'resources/list' });

    expect(res.status).toBe(200);
    const resources = res.body.result.resources;
    expect(resources.some((r: any) => r.uri === 'config://app')).toBe(true);
  });

  it('lists resource templates', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp')
      .send({ jsonrpc: '2.0', id: 7, method: 'resources/templates/list' });

    expect(res.status).toBe(200);
    const templates = res.body.result.resourceTemplates;
    expect(templates.some((r: any) => r.uriTemplate === 'users://{id}')).toBe(true);
  });

  it('reads a resource', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp')
      .send({
        jsonrpc: '2.0', id: 8, method: 'resources/read',
        params: { uri: 'config://app' },
      });

    expect(res.status).toBe(200);
    const contents = res.body.result.contents;
    expect(contents).toHaveLength(1);
    expect(JSON.parse(contents[0].text).env).toBe('test');
  });

  it('reads a template resource', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp')
      .send({
        jsonrpc: '2.0', id: 9, method: 'resources/read',
        params: { uri: 'users://42' },
      });

    expect(res.status).toBe(200);
    const parsed = JSON.parse(res.body.result.contents[0].text);
    expect(parsed.id).toBe('42');
  });

  it('lists auto-discovered prompts', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp')
      .send({ jsonrpc: '2.0', id: 10, method: 'prompts/list' });

    expect(res.status).toBe(200);
    const prompts = res.body.result.prompts;
    expect(prompts.some((p: any) => p.name === 'summarize')).toBe(true);
    expect(prompts[0].arguments).toBeDefined();
  });

  it('gets a prompt', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp')
      .send({
        jsonrpc: '2.0', id: 11, method: 'prompts/get',
        params: { name: 'summarize', arguments: { text: 'hello' } },
      });

    expect(res.status).toBe(200);
    const messages = res.body.result.messages;
    expect(messages).toHaveLength(1);
    expect(messages[0].content.text).toContain('hello');
  });

  it('returns error for unknown method', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp')
      .send({ jsonrpc: '2.0', id: 12, method: 'unknown/method' });

    expect(res.status).toBe(200);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32601);
  });

  it('maintains session via mcp-session-id header', async () => {
    // First request creates session
    const res1 = await request(app.getHttpServer())
      .post('/mcp')
      .send({ jsonrpc: '2.0', id: 1, method: 'initialize' });

    const sessionId = res1.headers['mcp-session-id'];
    expect(sessionId).toBeDefined();

    // Second request with same session
    const res2 = await request(app.getHttpServer())
      .post('/mcp')
      .set('mcp-session-id', sessionId)
      .send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });

    expect(res2.status).toBe(200);
    expect(res2.headers['mcp-session-id']).toBe(sessionId);
  });

  it('rejects invalid session id', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp')
      .set('mcp-session-id', 'invalid-session-id')
      .send({ jsonrpc: '2.0', id: 1, method: 'ping' });

    expect(res.status).toBe(404);
  });
});

// ─── Playground Tests ─────────────────────────────────────────────

(hasSupertest ? describe : describe.skip)('Playground Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        McpModule.forRoot({
          name: 'playground-test',
          version: '1.0.0',
          playground: true,
        }),
      ],
      providers: [ToolService, ResourceService, PromptService],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('serves playground HTML', async () => {
    const res = await request(app.getHttpServer())
      .get('/mcp-playground');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('playground-test');
    expect(res.text).toContain('1.0.0');
  });

  it('serves server info API', async () => {
    const res = await request(app.getHttpServer())
      .get('/mcp-playground/api/info');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('playground-test');
    expect(res.body.version).toBe('1.0.0');
  });

  it('lists tools via playground API', async () => {
    const res = await request(app.getHttpServer())
      .get('/mcp-playground/api/tools');

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.some((t: any) => t.name === 'add')).toBe(true);
  });

  it('lists resources via playground API', async () => {
    const res = await request(app.getHttpServer())
      .get('/mcp-playground/api/resources');

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.some((r: any) => r.uri === 'config://app')).toBe(true);
  });

  it('lists prompts via playground API', async () => {
    const res = await request(app.getHttpServer())
      .get('/mcp-playground/api/prompts');

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.some((p: any) => p.name === 'summarize')).toBe(true);
  });

  it('calls a tool via playground API', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp-playground/api/tools/call')
      .send({ name: 'add', arguments: { a: 5, b: 7 } });

    expect(res.status).toBe(200);
    expect(res.body.isError).toBeFalsy();
    const parsed = JSON.parse(res.body.content[0].text);
    expect(parsed.sum).toBe(12);
  });

  it('reads a resource via playground API', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp-playground/api/resources/read')
      .send({ uri: 'config://app' });

    expect(res.status).toBe(200);
    expect(res.body.contents).toHaveLength(1);
  });

  it('gets a prompt via playground API', async () => {
    const res = await request(app.getHttpServer())
      .post('/mcp-playground/api/prompts/get')
      .send({ name: 'summarize', arguments: { text: 'test' } });

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
  });
});
