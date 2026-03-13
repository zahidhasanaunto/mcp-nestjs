import { Module } from '@nestjs/common';
import { McpModule } from '../../src';
import { ResourceProvider } from './resource.provider';

/**
 * Resources example: static URIs and URI templates.
 * - config://app         → static config resource
 * - metrics://current    → live metrics snapshot
 * - users://{userId}     → parameterized user lookup
 * - logs://{level}       → filter logs by level
 */
@Module({
  imports: [
    McpModule.forRoot({
      name: 'resources-example',
      version: '1.0.0',
      transports: { sse: { enabled: true } },
      playground: true,
    }),
  ],
  providers: [ResourceProvider],
})
export class AppModule {}
