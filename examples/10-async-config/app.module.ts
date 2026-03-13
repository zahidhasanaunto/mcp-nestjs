import { Module } from '@nestjs/common';
import { McpModule } from '../../src';
import { ConfigModule } from './config.module';
import { ConfigService } from './config.service';
import { SearchService } from './search.service';

/**
 * Async config example: use McpModule.forRootAsync() to load
 * MCP config from another NestJS module (e.g. ConfigModule, database).
 */
@Module({
  imports: [
    ConfigModule,
    McpModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        name: config.get('MCP_SERVER_NAME'),
        version: config.get('MCP_SERVER_VERSION'),
        transports: {
          sse: { enabled: config.get('MCP_SSE_ENABLED') === 'true' },
          http: { enabled: config.get('MCP_HTTP_ENABLED') === 'true' },
        },
        session: {
          timeout: parseInt(config.get('MCP_SESSION_TIMEOUT') || '1800000'),
          maxSessions: parseInt(config.get('MCP_MAX_SESSIONS') || '500'),
        },
        playground: config.get('MCP_PLAYGROUND') === 'true',
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SearchService],
})
export class AppModule {}
