import { Injectable } from '@nestjs/common';
import { McpTool, McpToolGroup, McpGuard, ToolResult } from '../../src';
import { AuthGuard } from './auth.guard';

interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

@McpToolGroup('notes')
@Injectable()
export class NotesService {
  private notes: Note[] = [
    { id: 1, title: 'Welcome', content: 'Welcome to the notes app!', tags: ['intro'], createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' },
    { id: 2, title: 'TODO', content: 'Build more MCP tools', tags: ['todo', 'mcp'], createdAt: '2026-03-10T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
  ];
  private nextId = 3;

  // Auto transform (default): return value auto-wrapped in ToolResult
  @McpTool({
    description: 'List all notes with optional tag filter',
    schema: {
      tag: { type: 'string', description: 'Filter by tag', required: false },
      limit: { type: 'number', description: 'Max results', default: 50, required: false },
    },
  })
  async list(args: { tag?: string; limit?: number }) {
    let results = this.notes;
    if (args.tag) {
      results = results.filter(n => n.tags.includes(args.tag!));
    }
    return { notes: results.slice(0, args.limit || 50), total: results.length };
  }

  @McpTool({
    description: 'Get a note by ID',
    schema: {
      id: { type: 'number', description: 'Note ID' },
    },
  })
  async get(args: { id: number }) {
    const note = this.notes.find(n => n.id === args.id);
    if (!note) throw new Error(`Note ${args.id} not found`);
    return note;
  }

  // Raw transform: handler returns a ToolResult directly
  @McpTool({
    description: 'Create a new note',
    transform: 'raw',
    schema: {
      title: { type: 'string', description: 'Note title' },
      content: { type: 'string', description: 'Note body' },
      tags: { type: 'array', description: 'Tags', items: { type: 'string' }, required: false },
    },
  })
  async create(args: { title: string; content: string; tags?: string[] }): Promise<ToolResult> {
    const note: Note = {
      id: this.nextId++,
      title: args.title,
      content: args.content,
      tags: args.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.notes.push(note);
    return {
      content: [
        { type: 'text', text: `Created note #${note.id}: "${note.title}"` },
        { type: 'text', text: JSON.stringify(note, null, 2) },
      ],
    };
  }

  // Custom transform function: extract just the summary
  @McpTool({
    description: 'Update a note',
    transform: (result: Note) => ({
      content: [{
        type: 'text',
        text: `Updated note #${result.id} ("${result.title}") at ${result.updatedAt}`,
      }],
    }),
    schema: {
      id: { type: 'number', description: 'Note ID' },
      title: { type: 'string', description: 'New title', required: false },
      content: { type: 'string', description: 'New content', required: false },
      tags: { type: 'array', description: 'New tags', items: { type: 'string' }, required: false },
    },
  })
  async update(args: { id: number; title?: string; content?: string; tags?: string[] }): Promise<Note> {
    const note = this.notes.find(n => n.id === args.id);
    if (!note) throw new Error(`Note ${args.id} not found`);
    if (args.title) note.title = args.title;
    if (args.content) note.content = args.content;
    if (args.tags) note.tags = args.tags;
    note.updatedAt = new Date().toISOString();
    return note;
  }

  // Guarded tool: requires auth
  @McpGuard(AuthGuard)
  @McpTool({
    description: 'Delete a note (requires authentication)',
    schema: {
      id: { type: 'number', description: 'Note ID to delete' },
      token: { type: 'string', description: 'Auth token' },
    },
    excludeProperties: ['token'], // hide token from MCP schema
  })
  async delete(args: { id: number; token: string }) {
    const idx = this.notes.findIndex(n => n.id === args.id);
    if (idx === -1) throw new Error(`Note ${args.id} not found`);
    const deleted = this.notes.splice(idx, 1)[0];
    return { deleted: deleted.id, title: deleted.title };
  }

  // requiredProperties override
  @McpTool({
    description: 'Search notes by title and/or content',
    schema: {
      query: { type: 'string', description: 'Search text' },
      searchIn: { type: 'string', description: 'Where to search', enum: ['title', 'content', 'both'], required: false },
      caseSensitive: { type: 'boolean', description: 'Case-sensitive search', required: false },
    },
    requiredProperties: ['query'], // only query is truly required
  })
  async search(args: { query: string; searchIn?: string; caseSensitive?: boolean }) {
    const q = args.caseSensitive ? args.query : args.query.toLowerCase();
    const searchIn = args.searchIn || 'both';

    const results = this.notes.filter(n => {
      const title = args.caseSensitive ? n.title : n.title.toLowerCase();
      const content = args.caseSensitive ? n.content : n.content.toLowerCase();
      if (searchIn === 'title') return title.includes(q);
      if (searchIn === 'content') return content.includes(q);
      return title.includes(q) || content.includes(q);
    });

    return { results, count: results.length };
  }

  // Helper for resources/prompts
  getAllNotes(): Note[] {
    return this.notes;
  }

  getNoteById(id: number): Note | undefined {
    return this.notes.find(n => n.id === id);
  }
}
