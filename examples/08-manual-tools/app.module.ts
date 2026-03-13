import { Module } from '@nestjs/common';
import { McpModule, ToolRegistration } from '../../src';
import { DynamicToolService } from './dynamic-tool.service';

/**
 * Manual tool registration: tools defined as plain objects
 * passed to forRoot() or registered at runtime via ToolRegistryService.
 *
 * Useful for:
 * - Generating tools from config/database at startup
 * - Third-party integrations that aren't NestJS providers
 * - Dynamic tool loading
 */

const staticTools: ToolRegistration[] = [
  {
    definition: {
      name: 'echo',
      description: 'Echo back the input message',
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Message to echo' },
        },
        required: ['message'],
      },
    },
    handler: async (args) => ({
      content: [{ type: 'text', text: `Echo: ${args.message}` }],
    }),
  },
  {
    definition: {
      name: 'uuid',
      description: 'Generate a random UUID v4',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    handler: async () => {
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
      return { content: [{ type: 'text', text: uuid }] };
    },
  },
  {
    definition: {
      name: 'json_format',
      description: 'Format/prettify a JSON string',
      inputSchema: {
        type: 'object',
        properties: {
          json: { type: 'string', description: 'JSON string to format' },
          indent: { type: 'number', description: 'Indentation spaces (default 2)' },
        },
        required: ['json'],
      },
    },
    handler: async (args) => {
      try {
        const parsed = JSON.parse(args.json);
        const formatted = JSON.stringify(parsed, null, args.indent || 2);
        return { content: [{ type: 'text', text: formatted }] };
      } catch (e: any) {
        return { content: [{ type: 'text', text: `Invalid JSON: ${e.message}` }], isError: true };
      }
    },
  },
];

@Module({
  imports: [
    McpModule.forRoot({
      name: 'manual-tools-example',
      version: '1.0.0',
      transports: { sse: { enabled: true } },
      playground: true,
      tools: staticTools, // <-- registered at module init
    }),
  ],
  providers: [DynamicToolService],
})
export class AppModule {}
