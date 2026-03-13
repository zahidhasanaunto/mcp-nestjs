import { Module } from '@nestjs/common';
import { McpModule } from '../../src';
import { PromptProvider } from './prompt.provider';

/**
 * Prompts example: reusable prompt templates for LLMs.
 * - code_review: multi-message prompt for reviewing code
 * - summarize: summarize text with configurable length
 * - translate: translate text to a target language
 * - explain_error: explain an error message with context
 */
@Module({
  imports: [
    McpModule.forRoot({
      name: 'prompts-example',
      version: '1.0.0',
      transports: { sse: { enabled: true } },
      playground: true,
    }),
  ],
  providers: [PromptProvider],
})
export class AppModule {}
