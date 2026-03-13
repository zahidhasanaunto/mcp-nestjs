import { Injectable } from '@nestjs/common';
import { McpTool } from '../../src';

@Injectable()
export class GreetingService {
  @McpTool({
    description: 'Say hello to someone',
    schema: {
      name: { type: 'string', description: 'Name to greet' },
    },
  })
  async greet(args: { name: string }) {
    return { message: `Hello, ${args.name}! Welcome to nestjs-mcp.` };
  }

  @McpTool({
    description: 'Get the current server time',
  })
  async getTime() {
    return { time: new Date().toISOString() };
  }
}
