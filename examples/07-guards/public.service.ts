import { Injectable } from '@nestjs/common';
import { McpTool, McpGuard } from '../../src';
import { RateLimitGuard } from './guards';

@Injectable()
export class PublicService {
  // No guard — completely open
  @McpTool({
    description: 'Get server health (no auth required)',
  })
  async health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Method-level guard — rate limited
  @McpGuard(RateLimitGuard)
  @McpTool({
    description: 'Generate a random number (rate limited: 5/min)',
    schema: {
      min: { type: 'number', description: 'Minimum value', default: 1, required: false },
      max: { type: 'number', description: 'Maximum value', default: 100, required: false },
    },
  })
  async randomNumber(args: { min?: number; max?: number }) {
    const min = args.min ?? 1;
    const max = args.max ?? 100;
    return { value: Math.floor(Math.random() * (max - min + 1)) + min };
  }
}
