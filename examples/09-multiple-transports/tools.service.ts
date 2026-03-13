import { Injectable } from '@nestjs/common';
import { McpTool } from '../../src';

@Injectable()
export class ToolsService {
  @McpTool({
    description: 'Get information about the current session and transport',
    schema: {
      includeHeaders: { type: 'boolean', description: 'Include request headers', required: false },
    },
  })
  async sessionInfo(args: { includeHeaders?: boolean }) {
    // The context is passed automatically — in a real implementation
    // you'd use McpExecutionContext to inspect session details
    return {
      transport: 'determined-at-runtime',
      timestamp: new Date().toISOString(),
      note: 'This tool works identically regardless of transport (SSE, HTTP, or stdio)',
    };
  }

  @McpTool({
    description: 'Hash a string using a simple algorithm',
    schema: {
      input: { type: 'string', description: 'String to hash' },
      algorithm: {
        type: 'string',
        description: 'Hash algorithm',
        enum: ['simple', 'djb2', 'fnv1a'],
        required: false,
      },
    },
  })
  async hash(args: { input: string; algorithm?: string }) {
    const algo = args.algorithm || 'djb2';
    let hash: number;

    switch (algo) {
      case 'simple':
        hash = 0;
        for (let i = 0; i < args.input.length; i++) {
          hash = ((hash << 5) - hash + args.input.charCodeAt(i)) | 0;
        }
        break;
      case 'djb2':
        hash = 5381;
        for (let i = 0; i < args.input.length; i++) {
          hash = ((hash << 5) + hash + args.input.charCodeAt(i)) | 0;
        }
        break;
      case 'fnv1a':
        hash = 0x811c9dc5;
        for (let i = 0; i < args.input.length; i++) {
          hash ^= args.input.charCodeAt(i);
          hash = (hash * 0x01000193) | 0;
        }
        break;
      default:
        throw new Error(`Unknown algorithm: ${algo}`);
    }

    return {
      input: args.input,
      algorithm: algo,
      hash: (hash >>> 0).toString(16),
    };
  }
}
