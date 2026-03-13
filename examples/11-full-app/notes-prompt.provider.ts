import { Injectable } from '@nestjs/common';
import { McpPrompt } from '../../src';
import { NotesService } from './notes.service';

@Injectable()
export class NotesPromptProvider {
  constructor(private readonly notes: NotesService) {}

  @McpPrompt({
    name: 'summarize_notes',
    description: 'Generate a prompt to summarize all notes or notes with a specific tag',
    schema: {
      tag: { type: 'string', description: 'Optional tag filter', required: false },
      format: {
        type: 'string',
        description: 'Summary format',
        enum: ['bullet-points', 'paragraph', 'table'],
        required: false,
      },
    },
  })
  async summarizeNotes(args: { tag?: string; format?: string }) {
    let notes = this.notes.getAllNotes();
    if (args.tag) {
      notes = notes.filter(n => n.tags.includes(args.tag!));
    }

    const notesText = notes.map(n =>
      `- [#${n.id}] "${n.title}" (tags: ${n.tags.join(', ')})\n  ${n.content}`,
    ).join('\n');

    const format = args.format || 'bullet-points';

    return {
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            `Please summarize the following ${notes.length} notes in ${format} format:`,
            '',
            notesText,
            '',
            args.tag ? `These are notes tagged with "${args.tag}".` : 'These are all notes in the system.',
          ].join('\n'),
        },
      }],
    };
  }

  @McpPrompt({
    name: 'draft_note',
    description: 'Generate a prompt to help draft a new note on a given topic',
    schema: {
      topic: { type: 'string', description: 'Topic for the new note' },
      tone: {
        type: 'string',
        description: 'Writing tone',
        enum: ['technical', 'casual', 'formal'],
        required: false,
      },
    },
  })
  async draftNote(args: { topic: string; tone?: string }) {
    const tone = args.tone || 'casual';
    return {
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: [
            `Help me write a ${tone} note about: ${args.topic}`,
            '',
            'Please provide:',
            '1. A concise title',
            '2. Well-structured content (2-3 paragraphs)',
            '3. 2-4 relevant tags',
            '',
            'Format the response as JSON with fields: title, content, tags',
          ].join('\n'),
        },
      }],
    };
  }
}
