import { Module } from '@nestjs/common';
import { McpModule } from '../../src';
import { ToolsService } from './tools.service';

/**
 * Multiple transports example: SSE + Streamable HTTP + Stdio all enabled.
 *
 * - SSE:  GET /sse → event stream, POST /messages?sessionId=X → send calls
 * - HTTP: POST /mcp → stateless JSON-RPC (session via mcp-session-id header)
 * - Stdio: reads JSON-RPC from stdin, writes responses to stdout
 *
 * Session management is shared across all transports.
 */
@Module({
  imports: [
    McpModule.forRoot({
      name: 'multi-transport-example',
      version: '1.0.0',
      transports: {
        sse: { enabled: true, path: '/sse' },
        http: { enabled: true, path: '/mcp' },
        stdio: { enabled: false }, // set true to enable stdin/stdout mode
      },
      session: {
        timeout: 10 * 60 * 1000,    // 10 minute session timeout
        cleanupInterval: 60 * 1000, // cleanup every minute
        maxSessions: 100,
      },
      playground: true,
    }),
  ],
  providers: [ToolsService],
})
export class AppModule {}
