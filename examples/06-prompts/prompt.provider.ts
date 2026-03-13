import { Injectable } from '@nestjs/common';
import { McpPrompt } from '../../src';

@Injectable()
export class PromptProvider {
  @McpPrompt({
    name: 'code_review',
    description: 'Generate a code review prompt with language and focus area',
    schema: {
      code: { type: 'string', description: 'The code to review' },
      language: { type: 'string', description: 'Programming language' },
      focus: {
        type: 'string',
        description: 'Area to focus on',
        enum: ['security', 'performance', 'readability', 'all'],
        required: false,
      },
    },
  })
  async codeReview(args: { code: string; language: string; focus?: string }) {
    const focus = args.focus || 'all';
    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              `Please review the following ${args.language} code.`,
              focus !== 'all' ? `Focus specifically on ${focus} aspects.` : 'Provide a comprehensive review.',
              '',
              'Identify:',
              '- Potential bugs or issues',
              '- Suggestions for improvement',
              '- Best practices that are or aren\'t followed',
              '',
              '```' + args.language,
              args.code,
              '```',
            ].join('\n'),
          },
        },
      ],
    };
  }

  @McpPrompt({
    name: 'summarize',
    description: 'Create a summarization prompt with configurable length',
    schema: {
      text: { type: 'string', description: 'Text to summarize' },
      maxSentences: { type: 'number', description: 'Maximum sentences in summary', required: false },
      style: {
        type: 'string',
        description: 'Summary style',
        enum: ['bullet-points', 'paragraph', 'tldr'],
        required: false,
      },
    },
  })
  async summarize(args: { text: string; maxSentences?: number; style?: string }) {
    const style = args.style || 'paragraph';
    const limit = args.maxSentences ? ` in no more than ${args.maxSentences} sentences` : '';

    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Summarize the following text${limit} using ${style} format:\n\n${args.text}`,
          },
        },
      ],
    };
  }

  @McpPrompt({
    name: 'translate',
    description: 'Create a translation prompt',
    schema: {
      text: { type: 'string', description: 'Text to translate' },
      targetLanguage: { type: 'string', description: 'Target language (e.g. Spanish, French, Japanese)' },
      tone: {
        type: 'string',
        description: 'Desired tone',
        enum: ['formal', 'casual', 'technical'],
        required: false,
      },
    },
  })
  async translate(args: { text: string; targetLanguage: string; tone?: string }) {
    const tone = args.tone ? ` Use a ${args.tone} tone.` : '';
    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Translate the following text to ${args.targetLanguage}.${tone}\n\n${args.text}`,
          },
        },
      ],
    };
  }

  // A multi-turn prompt with system context
  @McpPrompt({
    name: 'explain_error',
    description: 'Generate a prompt to explain an error with surrounding context',
    schema: {
      errorMessage: { type: 'string', description: 'The error message' },
      stackTrace: { type: 'string', description: 'Stack trace (if available)', required: false },
      language: { type: 'string', description: 'Programming language', required: false },
    },
  })
  async explainError(args: { errorMessage: string; stackTrace?: string; language?: string }) {
    const parts = [`I encountered this error:\n\n\`\`\`\n${args.errorMessage}\n\`\`\``];

    if (args.stackTrace) {
      parts.push(`\nStack trace:\n\`\`\`\n${args.stackTrace}\n\`\`\``);
    }

    if (args.language) {
      parts.push(`\nThis is in a ${args.language} project.`);
    }

    parts.push('\nPlease explain:');
    parts.push('1. What this error means');
    parts.push('2. Common causes');
    parts.push('3. How to fix it');

    return {
      messages: [
        {
          role: 'user' as const,
          content: { type: 'text' as const, text: parts.join('\n') },
        },
      ],
    };
  }
}
