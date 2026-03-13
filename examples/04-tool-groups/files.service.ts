import { Injectable } from '@nestjs/common';
import { McpTool, McpToolGroup } from '../../src';

@McpToolGroup('files')
@Injectable()
export class FilesService {
  private store = new Map<string, string>([
    ['readme.md', '# My Project\nWelcome!'],
    ['config.json', '{"debug": false}'],
  ]);

  @McpTool({
    description: 'List all files in the virtual filesystem',
  })
  async list() {
    return {
      files: Array.from(this.store.keys()),
      count: this.store.size,
    };
  }

  @McpTool({
    description: 'Read a file by name',
    schema: {
      filename: { type: 'string', description: 'Name of the file to read' },
    },
  })
  async read(args: { filename: string }) {
    const content = this.store.get(args.filename);
    if (!content) throw new Error(`File not found: ${args.filename}`);
    return { filename: args.filename, content, size: content.length };
  }

  @McpTool({
    description: 'Write content to a file (creates or overwrites)',
    schema: {
      filename: { type: 'string', description: 'Name of the file' },
      content: { type: 'string', description: 'File content' },
    },
  })
  async write(args: { filename: string; content: string }) {
    const existed = this.store.has(args.filename);
    this.store.set(args.filename, args.content);
    return { filename: args.filename, action: existed ? 'updated' : 'created', size: args.content.length };
  }

  @McpTool({
    description: 'Delete a file',
    schema: {
      filename: { type: 'string', description: 'Name of the file to delete' },
    },
  })
  async delete(args: { filename: string }) {
    if (!this.store.delete(args.filename)) {
      throw new Error(`File not found: ${args.filename}`);
    }
    return { filename: args.filename, deleted: true };
  }
}
