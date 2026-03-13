import { Injectable } from '@nestjs/common';
import { McpTool, McpToolGroup, McpGuard } from '../../src';
import { ApiKeyGuard, LoggingGuard } from './guards';

// Class-level guard: every tool in this class requires an API key
@McpGuard(ApiKeyGuard, LoggingGuard)
@McpToolGroup('admin')
@Injectable()
export class AdminService {
  @McpTool({
    description: 'Get system status (requires API key)',
    schema: {
      apiKey: { type: 'string', description: 'API key for authentication' },
    },
  })
  async systemStatus(args: { apiKey: string }) {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  @McpTool({
    description: 'Get environment variables (requires API key, sensitive)',
    schema: {
      apiKey: { type: 'string', description: 'API key for authentication' },
      filter: { type: 'string', description: 'Filter env var names (prefix match)', required: false },
    },
  })
  async getEnv(args: { apiKey: string; filter?: string }) {
    const env = Object.entries(process.env)
      .filter(([key]) => !args.filter || key.startsWith(args.filter))
      .slice(0, 20) // limit output
      .map(([key, value]) => ({ key, value: value?.slice(0, 50) })); // truncate values

    return { variables: env, count: env.length };
  }
}
