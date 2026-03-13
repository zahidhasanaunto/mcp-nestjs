import { Module } from '@nestjs/common';
import { McpModule } from '../../src';
import { AdminService } from './admin.service';
import { PublicService } from './public.service';

/**
 * Guards example: per-class and per-method authorization.
 * - AdminService: all tools require API key via class-level guard
 * - PublicService: one open tool, one rate-limited tool
 */
@Module({
  imports: [
    McpModule.forRoot({
      name: 'guards-example',
      version: '1.0.0',
      transports: { sse: { enabled: true } },
      playground: true,
    }),
  ],
  providers: [AdminService, PublicService],
})
export class AppModule {}
