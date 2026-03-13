import { Module } from '@nestjs/common';
import { McpModule } from '../../src';
import { UserService } from './user.service';

/**
 * Zod schema example: validates tool inputs with Zod types.
 * Requires `npm install zod` in your project.
 */
@Module({
  imports: [
    McpModule.forRoot({
      name: 'zod-schema-example',
      version: '1.0.0',
      transports: { sse: { enabled: true } },
      playground: true,
    }),
  ],
  providers: [UserService],
})
export class AppModule {}
