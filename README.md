# mcp-nestjs

NestJS module for building [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers. Expose your NestJS services as MCP tools, resources, and prompts using decorators — with auto-discovery, multiple transports, and a built-in playground UI.

## Features

- **Decorator-driven** — `@McpTool()`, `@McpResource()`, `@McpPrompt()`, `@McpGuard()`, `@McpToolGroup()`
- **Auto-discovery** — decorated methods on any provider or controller are registered automatically
- **Schema adapters** — auto-detect Zod, Joi, class-validator, or inline schemas (zero config)
- **Multiple transports** — SSE, Streamable HTTP, and Stdio (JSON-RPC 2.0)
- **Built-in playground** — interactive UI at `/mcp-playground` to browse and test tools
- **Guards** — per-tool or per-class authorization
- **Session management** — configurable timeout, cleanup, and max sessions
- **No SDK dependency** — custom JSON-RPC 2.0 implementation

## Installation

```bash
npm install mcp-nestjs
```

### Peer dependencies (your NestJS app already has these):

```bash
npm install @nestjs/common @nestjs/core reflect-metadata rxjs
```

### Optional schema libraries (auto-detected):

```bash
npm install zod          # for Zod schemas
npm install joi          # for Joi schemas
npm install class-validator class-transformer  # for DTO schemas
```

## Quick Start

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { McpModule } from 'mcp-nestjs';
import { GreetingService } from './greeting.service';

@Module({
  imports: [
    McpModule.forRoot({
      name: 'my-mcp-server',
      version: '1.0.0',
      transports: { sse: { enabled: true } },
      playground: true,
    }),
  ],
  providers: [GreetingService],
})
export class AppModule {}
```

```typescript
// greeting.service.ts
import { Injectable } from '@nestjs/common';
import { McpTool } from 'mcp-nestjs';

@Injectable()
export class GreetingService {
  @McpTool({
    description: 'Say hello to someone',
    schema: {
      name: { type: 'string', description: 'Name to greet' },
    },
  })
  async greet(args: { name: string }) {
    return { message: `Hello, ${args.name}!` };
  }
}
```

Start your app and visit `http://localhost:3000/mcp-playground`.

## Module Configuration

### `McpModule.forRoot(options)`

```typescript
McpModule.forRoot({
  name: 'my-server',                    // Server name (required)
  version: '1.0.0',                     // Server version (required)
  transports: {
    sse:   { enabled: true, path: '/sse' },   // SSE transport
    http:  { enabled: true, path: '/mcp' },   // Streamable HTTP transport
    stdio: { enabled: false },                 // Stdio transport
  },
  session: {
    timeout: 30 * 60 * 1000,            // Session timeout (default: 30min)
    cleanupInterval: 5 * 60 * 1000,     // Cleanup interval (default: 5min)
    maxSessions: 1000,                   // Max concurrent sessions
  },
  playground: true,                      // Enable playground UI
  tools: [],                             // Manual tool registrations
  guards: [],                            // Global guards
})
```

### `McpModule.forRootAsync(options)`

```typescript
McpModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    name: config.get('MCP_SERVER_NAME'),
    version: config.get('MCP_VERSION'),
    transports: { sse: { enabled: true } },
    playground: true,
  }),
  inject: [ConfigService],
})
```

### `McpModule.forFeature(providers)`

Register additional providers in feature modules:

```typescript
McpModule.forFeature([MyFeatureService])
```

## Decorators

### `@McpTool(options)` — Method Decorator

Marks a method as an MCP tool.

```typescript
@McpTool({
  name?: string,                    // Override tool name (default: [group_]methodName)
  description: string,              // Required description
  schema?: ZodType | JoiSchema | Record<string, InlinePropertyDef>,  // Input schema
  transform?: 'auto' | 'raw' | ((result) => ToolResult),  // Response mode
  excludeProperties?: string[],     // Hide fields from schema
  requiredProperties?: string[],    // Override required fields
})
```

**Schema options:**

```typescript
// Inline (always available)
@McpTool({
  description: 'Search users',
  schema: {
    query: { type: 'string', description: 'Search term' },
    limit: { type: 'number', default: 10, required: false },
    role:  { type: 'string', enum: ['admin', 'user'] },
    tags:  { type: 'array', items: { type: 'string' }, required: false },
  },
})

// Zod (if installed)
import { z } from 'zod';
@McpTool({
  description: 'Create user',
  schema: z.object({
    name: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'user']).optional(),
  }),
})

// Joi (if installed)
import Joi from 'joi';
@McpTool({
  description: 'Create user',
  schema: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().required(),
  }),
})
```

**Transform modes:**

```typescript
// 'auto' (default) — return value auto-wrapped in ToolResult
@McpTool({ description: 'Get data' })
async getData() {
  return { key: 'value' }; // → { content: [{ type: 'text', text: '{"key":"value"}' }] }
}

// 'raw' — you return a ToolResult directly
@McpTool({ description: 'Get data', transform: 'raw' })
async getData(): Promise<ToolResult> {
  return { content: [{ type: 'text', text: 'hello' }] };
}

// Custom function
@McpTool({
  description: 'Get user',
  transform: (user) => ({
    content: [{ type: 'text', text: `User: ${user.name}` }],
  }),
})
```

### `@McpToolGroup(prefix?)` — Class Decorator

Prefixes all tool names in a class:

```typescript
@McpToolGroup('files')     // tools: files_list, files_read, files_write
@Injectable()
export class FilesService {
  @McpTool({ description: 'List files' })
  async list() { ... }

  @McpTool({ description: 'Read file' })
  async read(args: { path: string }) { ... }
}

@McpToolGroup()            // Auto-derive from @Controller path
```

### `@McpResource(options)` — Method Decorator

Exposes data as MCP resources:

```typescript
// Static resource
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
      text: JSON.stringify({ debug: true }),
    }],
  };
}

// Parameterized resource (URI template)
@McpResource({
  uriTemplate: 'users://{userId}',
  name: 'user_detail',
  mimeType: 'application/json',
})
async getUser(uri: string) {
  const id = uri.match(/users:\/\/(.+)/)?.[1];
  return { contents: [{ uri, text: JSON.stringify(user) }] };
}
```

### `@McpPrompt(options)` — Method Decorator

Reusable prompt templates:

```typescript
@McpPrompt({
  name: 'code_review',
  description: 'Generate a code review prompt',
  schema: {
    code: { type: 'string', description: 'Code to review' },
    language: { type: 'string', description: 'Programming language' },
  },
})
async codeReview(args: { code: string; language: string }) {
  return {
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `Review this ${args.language} code:\n\`\`\`\n${args.code}\n\`\`\``,
      },
    }],
  };
}
```

### `@McpGuard(...guards)` — Class or Method Decorator

Per-tool or per-class authorization:

```typescript
import { IMcpGuard, McpExecutionContext } from 'mcp-nestjs';

export class ApiKeyGuard implements IMcpGuard {
  canActivate(context: McpExecutionContext): boolean {
    const args = context.getArgs();
    return args.apiKey === 'secret';
  }
}

// Class-level: all tools require auth
@McpGuard(ApiKeyGuard)
@Injectable()
export class AdminService { ... }

// Method-level: only this tool requires auth
@McpGuard(RateLimitGuard)
@McpTool({ description: 'Sensitive operation' })
async sensitiveOp() { ... }
```

**`McpExecutionContext` provides:**
- `getSessionId()` — current session ID
- `getArgs()` — tool/prompt arguments
- `getRequest()` — raw transport request
- `getToolName()` — tool/resource/prompt name
- `getType()` — `'tool' | 'resource' | 'prompt'`

## Manual Tool Registration

```typescript
// Via forRoot options
McpModule.forRoot({
  ...config,
  tools: [{
    definition: {
      name: 'echo',
      description: 'Echo input',
      inputSchema: {
        type: 'object',
        properties: { message: { type: 'string' } },
        required: ['message'],
      },
    },
    handler: async (args) => ({
      content: [{ type: 'text', text: args.message }],
    }),
  }],
})

// Via ToolRegistryService at runtime
@Injectable()
export class DynamicTools implements OnModuleInit {
  constructor(private registry: ToolRegistryService) {}

  onModuleInit() {
    this.registry.registerTool({ definition: {...}, handler: async (args) => {...} });
  }
}
```

## Transports

### SSE (Server-Sent Events)

```
GET  /sse              → Opens SSE stream, returns session endpoint
POST /messages?sessionId=X  → Send JSON-RPC requests
```

### Streamable HTTP

```
POST /mcp              → Single JSON-RPC request/response
                         Session via `mcp-session-id` header
```

### Stdio

Reads JSON-RPC from stdin, writes responses to stdout. For CLI subprocess spawning.

## Playground

Enable with `playground: true` in module options. Visit `/mcp-playground` to:

- Browse all registered tools, resources, and prompts
- View input schemas with types, required fields, and descriptions
- Auto-generated forms for each tool
- Execute tools and see results with timing
- Read resources by URI
- Test prompts with arguments

## Examples

See the [`examples/`](./examples) directory for complete working examples:

| Example | What it shows |
|---------|--------------|
| `01-basic` | Minimal setup — one service, two tools |
| `02-inline-schema` | All inline schema options — enums, arrays, defaults, optionals |
| `03-zod-schema` | Zod schema integration |
| `04-tool-groups` | `@McpToolGroup` prefix namespacing |
| `05-resources` | Static URIs and URI templates |
| `06-prompts` | Reusable prompt templates |
| `07-guards` | API key auth, rate limiting, logging guards |
| `08-manual-tools` | `forRoot({ tools })` + runtime `ToolRegistryService` |
| `09-multiple-transports` | SSE + HTTP + Stdio with session config |
| `10-async-config` | `forRootAsync()` with injected ConfigService |
| `11-full-app` | Everything combined |

Run any example:

```bash
npx ts-node -r reflect-metadata examples/01-basic/main.ts
```

## License

MIT
