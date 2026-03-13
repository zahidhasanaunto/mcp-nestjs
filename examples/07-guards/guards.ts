import { IMcpGuard, McpExecutionContext } from '../../src';

/**
 * Checks for an API key in the tool arguments.
 * In a real app, you'd check request headers or session data.
 */
export class ApiKeyGuard implements IMcpGuard {
  async canActivate(context: McpExecutionContext): Promise<boolean> {
    const args = context.getArgs();
    if (!args.apiKey || args.apiKey !== 'secret-key-123') {
      throw new Error('Invalid or missing API key');
    }
    return true;
  }
}

/**
 * Simple rate limiter: max 5 calls per tool per minute.
 */
export class RateLimitGuard implements IMcpGuard {
  private calls = new Map<string, number[]>();

  async canActivate(context: McpExecutionContext): Promise<boolean> {
    const key = `${context.getSessionId()}:${context.getToolName()}`;
    const now = Date.now();
    const windowMs = 60_000;
    const maxCalls = 5;

    const timestamps = (this.calls.get(key) || []).filter(t => now - t < windowMs);
    if (timestamps.length >= maxCalls) {
      throw new Error(`Rate limit exceeded: max ${maxCalls} calls per minute for ${context.getToolName()}`);
    }

    timestamps.push(now);
    this.calls.set(key, timestamps);
    return true;
  }
}

/**
 * Logs every tool call (demonstration of a passthrough guard).
 */
export class LoggingGuard implements IMcpGuard {
  canActivate(context: McpExecutionContext): boolean {
    console.log(`[MCP] ${context.getType()} call: ${context.getToolName()} (session: ${context.getSessionId()})`);
    return true;
  }
}
