import { Module } from '@nestjs/common';
import { McpModule } from '../../src';
import { GreetingService } from './greeting.service';

/**
 * Minimal example: one tool on a provider, SSE transport + playground.
 *
 * Start:  npx ts-node -r reflect-metadata examples/01-basic/main.ts
 * Test:   http://localhost:3000/mcp-playground
 */
@Module({
  imports: [
    McpModule.forRoot({
      name: 'basic-example',
      version: '1.0.0',
      transports: { sse: { enabled: true } },
      playground: true,
    }),
  ],
  providers: [GreetingService],
})
export class AppModule {}
