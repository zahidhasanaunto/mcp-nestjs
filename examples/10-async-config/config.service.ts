import { Injectable } from '@nestjs/common';

/**
 * Simple config service that reads from env with defaults.
 * In production you'd use @nestjs/config or similar.
 */
@Injectable()
export class ConfigService {
  private defaults: Record<string, string> = {
    MCP_SERVER_NAME: 'async-config-example',
    MCP_SERVER_VERSION: '1.0.0',
    MCP_SSE_ENABLED: 'true',
    MCP_HTTP_ENABLED: 'true',
    MCP_SESSION_TIMEOUT: '1800000',
    MCP_MAX_SESSIONS: '500',
    MCP_PLAYGROUND: 'true',
  };

  get(key: string): string {
    return process.env[key] || this.defaults[key] || '';
  }
}
