import { Module } from '@nestjs/common';
import { McpModule } from '../../src';
import { NotesService } from './notes.service';
import { NotesResourceProvider } from './notes-resource.provider';
import { NotesPromptProvider } from './notes-prompt.provider';
import { AuthGuard } from './auth.guard';

/**
 * Full-featured example combining ALL library features:
 * - Tools with inline schemas (@McpTool)
 * - Tool groups with prefix (@McpToolGroup)
 * - Resources with static URI and templates (@McpResource)
 * - Prompts with arguments (@McpPrompt)
 * - Guards at class and method level (@McpGuard)
 * - Manual tool registration
 * - Transform modes (auto, raw, custom)
 * - excludeProperties / requiredProperties
 * - Multiple transports (SSE + HTTP)
 * - Session configuration
 * - Playground UI
 */
@Module({
  imports: [
    McpModule.forRoot({
      name: 'full-example-app',
      version: '2.0.0',
      transports: {
        sse: { enabled: true },
        http: { enabled: true },
      },
      session: {
        timeout: 15 * 60 * 1000,
        maxSessions: 200,
      },
      playground: { enabled: true },
      tools: [
        // Manual tool: server uptime
        {
          definition: {
            name: 'server_uptime',
            description: 'Get server uptime in seconds',
            inputSchema: { type: 'object', properties: {} },
          },
          handler: async () => ({
            content: [{
              type: 'text',
              text: JSON.stringify({ uptime: Math.floor(process.uptime()), unit: 'seconds' }),
            }],
          }),
        },
      ],
    }),
  ],
  providers: [NotesService, NotesResourceProvider, NotesPromptProvider],
})
export class AppModule {}
