import { Injectable } from '@nestjs/common';
import { McpTool } from '../../src';

@Injectable()
export class SearchService {
  private data = [
    { id: 1, title: 'Getting Started with NestJS', tags: ['nestjs', 'tutorial'] },
    { id: 2, title: 'MCP Protocol Overview', tags: ['mcp', 'protocol'] },
    { id: 3, title: 'Building MCP Servers', tags: ['mcp', 'server', 'tutorial'] },
    { id: 4, title: 'Advanced NestJS Patterns', tags: ['nestjs', 'advanced'] },
    { id: 5, title: 'TypeScript Best Practices', tags: ['typescript', 'best-practices'] },
  ];

  @McpTool({
    description: 'Search articles by title or tag',
    schema: {
      query: { type: 'string', description: 'Search query (matches title or tags)' },
      limit: { type: 'number', description: 'Max results', default: 10, required: false },
    },
  })
  async search(args: { query: string; limit?: number }) {
    const q = args.query.toLowerCase();
    const results = this.data
      .filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.tags.some(t => t.includes(q)),
      )
      .slice(0, args.limit || 10);

    return { results, total: results.length };
  }
}
