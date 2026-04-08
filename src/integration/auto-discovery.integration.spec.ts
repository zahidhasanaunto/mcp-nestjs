import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Controller } from '@nestjs/common';
import { McpModule } from '../mcp.module';
import { McpTool } from '../decorators/mcp-tool.decorator';
import { McpToolGroup } from '../decorators/mcp-tool-group.decorator';
import { McpResource } from '../decorators/mcp-resource.decorator';
import { McpPrompt } from '../decorators/mcp-prompt.decorator';
import { McpGuard } from '../decorators/mcp-guard.decorator';
import { ToolRegistryService } from '../registry/tool-registry.service';
import { McpExecutionContext, McpGuard as IMcpGuard } from '../interfaces/guard.interfaces';
import { z } from 'zod';

// ─── Test Services ────────────────────────────────────────────────

@Injectable()
class BasicToolService {
  @McpTool({
    description: 'Greet someone',
    schema: {
      name: { type: 'string', description: 'Name to greet', required: true },
    },
  })
  async greet(args: { name: string }) {
    return { message: `Hello, ${args.name}!` };
  }

  @McpTool({
    name: 'custom_echo',
    description: 'Echo a message with custom name',
    schema: {
      message: { type: 'string', description: 'Message to echo' },
    },
  })
  async echo(args: { message: string }) {
    return args.message;
  }

  @McpTool({
    description: 'A tool with no schema',
  })
  async noSchema() {
    return 'no-schema-result';
  }
}

@Injectable()
class ZodToolService {
  @McpTool({
    description: 'Add two numbers using Zod schema',
    schema: z.object({
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    }),
  })
  async add(args: { a: number; b: number }) {
    return { sum: args.a + args.b };
  }

  @McpTool({
    description: 'Tool with optional Zod fields',
    schema: z.object({
      required_field: z.string(),
      optional_field: z.string().optional(),
      default_field: z.number().default(42),
    }),
  })
  async zodOptional(args: any) {
    return args;
  }
}

@Injectable()
@McpToolGroup('db')
class GroupedToolService {
  @McpTool({ description: 'Query the database' })
  async query(args: any) {
    return { rows: [] };
  }

  @McpTool({ description: 'Insert into database' })
  async insert(args: any) {
    return { inserted: true };
  }

  @McpTool({
    name: 'db_custom_name',
    description: 'Tool with explicit name ignores group prefix',
  })
  async customNamed() {
    return 'custom';
  }
}

@Injectable()
@McpToolGroup()
class AutoGroupService {
  @McpTool({ description: 'Auto-grouped tool' })
  async doSomething() {
    return 'done';
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
      contents: [{
        uri: 'config://app',
        mimeType: 'application/json',
        text: JSON.stringify({ env: 'test' }),
      }],
    };
  }

  @McpResource({
    uriTemplate: 'users://{userId}/profile',
    name: 'user_profile',
    description: 'Get user profile by ID',
  })
  async getUserProfile(uri: string) {
    const match = uri.match(/users:\/\/(\w+)\/profile/);
    const userId = match ? match[1] : 'unknown';
    return {
      contents: [{
        uri,
        text: JSON.stringify({ userId, name: 'Test User' }),
      }],
    };
  }
}

@Injectable()
class PromptService {
  @McpPrompt({
    name: 'summarize',
    description: 'Summarize the given text',
    schema: {
      text: { type: 'string', description: 'Text to summarize', required: true },
      style: { type: 'string', description: 'Summary style', required: false },
    },
  })
  async summarize(args: { text: string; style?: string }) {
    return {
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Please summarize the following${args.style ? ` in ${args.style} style` : ''}: ${args.text}`,
        },
      }],
    };
  }

  @McpPrompt({
    name: 'code_review',
    description: 'Review code',
    schema: z.object({
      code: z.string().describe('Code to review'),
      language: z.string().optional().describe('Programming language'),
    }),
  })
  async codeReview(args: { code: string; language?: string }) {
    return {
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Review this ${args.language || ''} code: ${args.code}`,
        },
      }],
    };
  }
}

@Injectable()
class TransformService {
  @McpTool({
    description: 'Returns raw MCP result',
    transform: 'raw',
  })
  async rawResult() {
    return {
      content: [{ type: 'text', text: 'raw-output' }],
    };
  }

  @McpTool({
    description: 'Returns null',
  })
  async returnsNull() {
    return null;
  }

  @McpTool({
    description: 'Returns a plain string',
  })
  async returnsString() {
    return 'plain-string';
  }

  @McpTool({
    description: 'Returns object with data property',
  })
  async returnsData() {
    return { data: { key: 'value' } };
  }

  @McpTool({
    description: 'Custom transform function',
    transform: (result: any) => ({
      content: [{ type: 'text', text: `transformed:${result}` }],
    }),
  })
  async customTransform() {
    return 'original';
  }
}

@Injectable()
class ErrorToolService {
  @McpTool({ description: 'Tool that throws' })
  async throwingTool() {
    throw new Error('intentional error');
  }
}

@Injectable()
class ExcludePropsService {
  @McpTool({
    description: 'Tool with excluded properties',
    schema: {
      keep: { type: 'string', description: 'Keep this' },
      exclude_me: { type: 'string', description: 'Exclude this' },
      also_exclude: { type: 'number', description: 'Also exclude' },
    },
    excludeProperties: ['exclude_me', 'also_exclude'],
  })
  async filtered(args: any) {
    return args;
  }
}

@Injectable()
class RequiredOverrideService {
  @McpTool({
    description: 'Tool with required override',
    schema: {
      a: { type: 'string', required: true },
      b: { type: 'string', required: true },
      c: { type: 'string', required: false },
    },
    requiredProperties: ['a'],
  })
  async overridden(args: any) {
    return args;
  }
}

// ─── Test Suites ──────────────────────────────────────────────────

describe('Auto-Discovery Integration', () => {
  let module: TestingModule;
  let registry: ToolRegistryService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        McpModule.forRoot({
          name: 'test-server',
          version: '1.0.0',
        }),
      ],
      providers: [
        BasicToolService,
        ZodToolService,
        GroupedToolService,
        AutoGroupService,
        ResourceService,
        PromptService,
        TransformService,
        ErrorToolService,
        ExcludePropsService,
        RequiredOverrideService,
      ],
    }).compile();

    await module.init();
    registry = module.get(ToolRegistryService);
  });

  afterAll(async () => {
    await module?.close();
  });

  // ── Basic Tool Discovery ──

  describe('Basic Tool Discovery', () => {
    it('discovers tools from decorated methods', () => {
      const tools = registry.getToolDefinitions();
      expect(tools.length).toBeGreaterThanOrEqual(5);
    });

    it('uses method name as default tool name', () => {
      const tools = registry.getToolDefinitions();
      const greet = tools.find(t => t.name === 'greet');
      expect(greet).toBeDefined();
      expect(greet!.description).toBe('Greet someone');
    });

    it('uses custom name when provided', () => {
      const tools = registry.getToolDefinitions();
      const echo = tools.find(t => t.name === 'custom_echo');
      expect(echo).toBeDefined();
      expect(echo!.description).toBe('Echo a message with custom name');
    });

    it('handles tools with no schema', () => {
      const tools = registry.getToolDefinitions();
      const noSchema = tools.find(t => t.name === 'noSchema');
      expect(noSchema).toBeDefined();
      expect(noSchema!.inputSchema).toBeDefined();
      expect(noSchema!.inputSchema.type).toBe('object');
    });
  });

  // ── Inline Schema ──

  describe('Inline Schema Adapter', () => {
    it('converts inline schema to JSON Schema', () => {
      const tools = registry.getToolDefinitions();
      const greet = tools.find(t => t.name === 'greet');
      expect(greet!.inputSchema.properties).toHaveProperty('name');
      expect(greet!.inputSchema.properties.name.type).toBe('string');
      expect(greet!.inputSchema.properties.name.description).toBe('Name to greet');
    });

    it('marks required fields', () => {
      const tools = registry.getToolDefinitions();
      const greet = tools.find(t => t.name === 'greet');
      expect(greet!.inputSchema.required).toContain('name');
    });
  });

  // ── Zod Schema ──

  describe('Zod Schema Adapter', () => {
    it('converts Zod schema to JSON Schema', () => {
      const tools = registry.getToolDefinitions();
      const add = tools.find(t => t.name === 'add');
      expect(add).toBeDefined();
      expect(add!.inputSchema.properties.a).toEqual({ type: 'number', description: 'First number' });
      expect(add!.inputSchema.properties.b).toEqual({ type: 'number', description: 'Second number' });
      expect(add!.inputSchema.required).toContain('a');
      expect(add!.inputSchema.required).toContain('b');
    });

    it('handles optional and default Zod fields', () => {
      const tools = registry.getToolDefinitions();
      const zop = tools.find(t => t.name === 'zodOptional');
      expect(zop).toBeDefined();
      expect(zop!.inputSchema.required).toContain('required_field');
      expect(zop!.inputSchema.required).not.toContain('optional_field');
      expect(zop!.inputSchema.required).not.toContain('default_field');
    });
  });

  // ── Tool Groups ──

  describe('Tool Groups', () => {
    it('prefixes tool names with group name', () => {
      const tools = registry.getToolDefinitions();
      const query = tools.find(t => t.name === 'db_query');
      const insert = tools.find(t => t.name === 'db_insert');
      expect(query).toBeDefined();
      expect(query!.description).toBe('Query the database');
      expect(insert).toBeDefined();
      expect(insert!.description).toBe('Insert into database');
    });

    it('uses explicit name over group prefix', () => {
      const tools = registry.getToolDefinitions();
      const custom = tools.find(t => t.name === 'db_custom_name');
      expect(custom).toBeDefined();
    });
  });

  // ── Tool Execution ──

  describe('Tool Execution', () => {
    it('executes a discovered tool with inline schema', async () => {
      const result = await registry.executeTool('greet', { name: 'World' });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Hello, World!');
    });

    it('executes a discovered tool with Zod schema', async () => {
      const result = await registry.executeTool('add', { a: 3, b: 4 });
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text!);
      expect(parsed.sum).toBe(7);
    });

    it('executes grouped tools', async () => {
      const result = await registry.executeTool('db_query', {});
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text!);
      expect(parsed.rows).toEqual([]);
    });

    it('returns string results directly', async () => {
      const result = await registry.executeTool('custom_echo', { message: 'hi' });
      expect(result.content[0].text).toBe('hi');
    });

    it('handles errors gracefully', async () => {
      const result = await registry.executeTool('throwingTool', {});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('intentional error');
    });

    it('returns error for unknown tool', async () => {
      const result = await registry.executeTool('nonexistent', {});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool');
    });
  });

  // ── Result Transforms ──

  describe('Result Transforms', () => {
    it('handles raw transform', async () => {
      const result = await registry.executeTool('rawResult', {});
      expect(result.content[0].text).toBe('raw-output');
    });

    it('handles null results', async () => {
      const result = await registry.executeTool('returnsNull', {});
      expect(result.content[0].text).toBe('null');
    });

    it('handles string results', async () => {
      const result = await registry.executeTool('returnsString', {});
      expect(result.content[0].text).toBe('plain-string');
    });

    it('unwraps data property', async () => {
      const result = await registry.executeTool('returnsData', {});
      const parsed = JSON.parse(result.content[0].text!);
      expect(parsed.key).toBe('value');
    });

    it('handles custom transform function', async () => {
      const result = await registry.executeTool('customTransform', {});
      expect(result.content[0].text).toBe('transformed:original');
    });
  });

  // ── Exclude / Required Override ──

  describe('Schema Modifiers', () => {
    it('excludes specified properties', () => {
      const tools = registry.getToolDefinitions();
      const filtered = tools.find(t => t.name === 'filtered');
      expect(filtered).toBeDefined();
      expect(filtered!.inputSchema.properties).toHaveProperty('keep');
      expect(filtered!.inputSchema.properties).not.toHaveProperty('exclude_me');
      expect(filtered!.inputSchema.properties).not.toHaveProperty('also_exclude');
    });

    it('overrides required properties', () => {
      const tools = registry.getToolDefinitions();
      const overridden = tools.find(t => t.name === 'overridden');
      expect(overridden).toBeDefined();
      expect(overridden!.inputSchema.required).toEqual(['a']);
    });
  });

  // ── Resource Discovery ──

  describe('Resource Discovery', () => {
    it('discovers static resources', () => {
      const resources = registry.getResourceDefinitions();
      const config = resources.find(r => r.uri === 'config://app');
      expect(config).toBeDefined();
      expect(config!.name).toBe('app_config');
      expect(config!.mimeType).toBe('application/json');
    });

    it('discovers resource templates', () => {
      const resources = registry.getResourceDefinitions();
      const profile = resources.find(r => r.uriTemplate === 'users://{userId}/profile');
      expect(profile).toBeDefined();
      expect(profile!.name).toBe('user_profile');
    });

    it('executes a static resource', async () => {
      const result = await registry.executeResource('config://app');
      expect(result.contents).toHaveLength(1);
      const parsed = JSON.parse(result.contents[0].text!);
      expect(parsed.env).toBe('test');
    });

    it('executes a template resource', async () => {
      const result = await registry.executeResource('users://42/profile');
      expect(result.contents).toHaveLength(1);
      const parsed = JSON.parse(result.contents[0].text!);
      expect(parsed.userId).toBe('42');
    });

    it('throws for unknown resource', async () => {
      await expect(registry.executeResource('unknown://x')).rejects.toThrow('Unknown resource');
    });
  });

  // ── Prompt Discovery ──

  describe('Prompt Discovery', () => {
    it('discovers prompts with inline schema args', () => {
      const prompts = registry.getPromptDefinitions();
      const summarize = prompts.find(p => p.name === 'summarize');
      expect(summarize).toBeDefined();
      expect(summarize!.description).toBe('Summarize the given text');
      expect(summarize!.arguments).toBeDefined();
      expect(summarize!.arguments!.length).toBe(2);
      const textArg = summarize!.arguments!.find(a => a.name === 'text');
      expect(textArg).toBeDefined();
      expect(textArg!.required).toBe(true);
      const styleArg = summarize!.arguments!.find(a => a.name === 'style');
      expect(styleArg).toBeDefined();
      expect(styleArg!.required).toBe(false);
    });

    it('discovers prompts with Zod schema args', () => {
      const prompts = registry.getPromptDefinitions();
      const review = prompts.find(p => p.name === 'code_review');
      expect(review).toBeDefined();
      expect(review!.arguments).toBeDefined();
      const codeArg = review!.arguments!.find(a => a.name === 'code');
      expect(codeArg).toBeDefined();
      expect(codeArg!.required).toBe(true);
      const langArg = review!.arguments!.find(a => a.name === 'language');
      expect(langArg).toBeDefined();
      expect(langArg!.required).toBe(false);
    });

    it('executes a prompt', async () => {
      const result = await registry.executePrompt('summarize', { text: 'hello world' });
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content.text).toContain('hello world');
    });

    it('executes a prompt with optional args', async () => {
      const result = await registry.executePrompt('summarize', { text: 'data', style: 'brief' });
      expect(result.messages[0].content.text).toContain('brief');
    });

    it('throws for unknown prompt', async () => {
      await expect(registry.executePrompt('unknown', {})).rejects.toThrow('Unknown prompt');
    });
  });

  // ── Counts ──

  describe('Registry Counts', () => {
    it('reports correct tool count', () => {
      // greet, custom_echo, noSchema, add, zodOptional, db_query, db_insert, db_custom_name,
      // doSomething, rawResult, returnsNull, returnsString, returnsData, customTransform,
      // throwingTool, filtered, overridden = 17
      expect(registry.getToolCount()).toBeGreaterThanOrEqual(15);
    });

    it('reports correct resource count', () => {
      expect(registry.getResourceCount()).toBe(2);
    });

    it('reports correct prompt count', () => {
      expect(registry.getPromptCount()).toBe(2);
    });
  });
});

// ─── JSON-RPC Integration ─────────────────────────────────────────

describe('JSON-RPC Handler with Auto-Discovered Tools', () => {
  let module: TestingModule;
  let registry: ToolRegistryService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        McpModule.forRoot({
          name: 'rpc-test-server',
          version: '2.0.0',
        }),
      ],
      providers: [BasicToolService, ResourceService, PromptService],
    }).compile();

    await module.init();
    registry = module.get(ToolRegistryService);
  });

  afterAll(async () => {
    await module?.close();
  });

  it('lists tools via registry after discovery', () => {
    const tools = registry.getToolDefinitions();
    expect(tools.some(t => t.name === 'greet')).toBe(true);
    expect(tools.some(t => t.name === 'custom_echo')).toBe(true);
  });

  it('executes discovered tools', async () => {
    const result = await registry.executeTool('greet', { name: 'RPC' });
    expect(result.content[0].text).toContain('Hello, RPC!');
  });

  it('lists resources after discovery', () => {
    const resources = registry.getResourceDefinitions();
    expect(resources.some(r => r.uri === 'config://app')).toBe(true);
  });

  it('lists prompts after discovery', () => {
    const prompts = registry.getPromptDefinitions();
    expect(prompts.some(p => p.name === 'summarize')).toBe(true);
  });
});

// ─── Manual + Auto Discovery Combined ─────────────────────────────

describe('Manual Registration + Auto-Discovery Combined', () => {
  let module: TestingModule;
  let registry: ToolRegistryService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        McpModule.forRoot({
          name: 'combined-server',
          version: '1.0.0',
          tools: [
            {
              definition: {
                name: 'manual_tool',
                description: 'Manually registered tool',
                inputSchema: { type: 'object', properties: { x: { type: 'string' } } },
              },
              handler: async (args) => ({
                content: [{ type: 'text', text: `manual:${args.x}` }],
              }),
            },
          ],
        }),
      ],
      providers: [BasicToolService],
    }).compile();

    await module.init();
    registry = module.get(ToolRegistryService);
  });

  afterAll(async () => {
    await module?.close();
  });

  it('has both manual and auto-discovered tools', () => {
    const tools = registry.getToolDefinitions();
    expect(tools.some(t => t.name === 'manual_tool')).toBe(true);
    expect(tools.some(t => t.name === 'greet')).toBe(true);
  });

  it('can execute manual tool', async () => {
    const result = await registry.executeTool('manual_tool', { x: 'hello' });
    expect(result.content[0].text).toBe('manual:hello');
  });

  it('can execute auto-discovered tool', async () => {
    const result = await registry.executeTool('greet', { name: 'Combined' });
    expect(result.content[0].text).toContain('Hello, Combined!');
  });
});

// ─── Discovery Disabled ───────────────────────────────────────────

describe('Discovery Disabled', () => {
  let module: TestingModule;
  let registry: ToolRegistryService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        McpModule.forRoot({
          name: 'no-discovery-server',
          version: '1.0.0',
          discovery: false,
          tools: [
            {
              definition: {
                name: 'only_manual',
                description: 'Only manual',
                inputSchema: { type: 'object', properties: {} },
              },
              handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
            },
          ],
        }),
      ],
      providers: [BasicToolService],
    }).compile();

    await module.init();
    registry = module.get(ToolRegistryService);
  });

  afterAll(async () => {
    await module?.close();
  });

  it('only has manually registered tools', () => {
    const tools = registry.getToolDefinitions();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('only_manual');
  });

  it('does not discover decorated tools', () => {
    const tools = registry.getToolDefinitions();
    expect(tools.some(t => t.name === 'greet')).toBe(false);
  });
});

// ─── forRootAsync ─────────────────────────────────────────────────

describe('forRootAsync Discovery', () => {
  let module: TestingModule;
  let registry: ToolRegistryService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        McpModule.forRootAsync({
          useFactory: () => ({
            name: 'async-server',
            version: '3.0.0',
          }),
        }),
      ],
      providers: [BasicToolService, ResourceService],
    }).compile();

    await module.init();
    registry = module.get(ToolRegistryService);
  });

  afterAll(async () => {
    await module?.close();
  });

  it('discovers tools with async config', () => {
    const tools = registry.getToolDefinitions();
    expect(tools.some(t => t.name === 'greet')).toBe(true);
  });

  it('discovers resources with async config', () => {
    const resources = registry.getResourceDefinitions();
    expect(resources.some(r => r.uri === 'config://app')).toBe(true);
  });
});
