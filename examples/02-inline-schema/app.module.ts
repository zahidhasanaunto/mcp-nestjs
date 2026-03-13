import { Module } from '@nestjs/common';
import { McpModule } from '../../src';
import { CalculatorService } from './calculator.service';

/**
 * Inline schema example: shows all InlinePropertyDef options —
 * types, enums, defaults, arrays, optional fields, descriptions.
 */
@Module({
  imports: [
    McpModule.forRoot({
      name: 'inline-schema-example',
      version: '1.0.0',
      transports: { sse: { enabled: true } },
      playground: true,
    }),
  ],
  providers: [CalculatorService],
})
export class AppModule {}
