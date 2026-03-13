import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { ToolRegistryService } from '../registry/tool-registry.service';
import { MCP_MODULE_OPTIONS } from '../mcp.constants';
import { McpModuleOptions } from '../interfaces/module-options.interfaces';
import { JsonRpcHandler } from './json-rpc-handler';

@Injectable()
export class StdioService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StdioService.name);
  private readonly jsonRpc: JsonRpcHandler;
  private buffer = '';
  private stdinListener: ((data: Buffer) => void) | null = null;

  constructor(
    private readonly registry: ToolRegistryService,
    @Inject(MCP_MODULE_OPTIONS) private readonly options: McpModuleOptions,
  ) {
    this.jsonRpc = new JsonRpcHandler(registry, options);
  }

  onModuleInit() {
    if (!this.options.transports?.stdio?.enabled) return;

    this.logger.log('Stdio transport enabled');
    this.stdinListener = (data: Buffer) => {
      this.buffer += data.toString();
      this.processBuffer();
    };
    process.stdin.on('data', this.stdinListener);
    process.stdin.resume();
  }

  private async processBuffer() {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const request = JSON.parse(trimmed);
        const response = await this.jsonRpc.handle(request, 'stdio');
        // Only send response for requests (not notifications)
        if (request.id !== undefined) {
          process.stdout.write(JSON.stringify(response) + '\n');
        }
      } catch (error: any) {
        const errorResponse = {
          jsonrpc: '2.0',
          error: { code: -32700, message: 'Parse error' },
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
      }
    }
  }

  onModuleDestroy() {
    if (this.stdinListener) {
      process.stdin.removeListener('data', this.stdinListener);
      this.stdinListener = null;
    }
  }
}
