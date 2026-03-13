import { IMcpGuard, McpExecutionContext } from '../../src';

/**
 * Checks for a token in args. In a real app, validate JWT/session.
 */
export class AuthGuard implements IMcpGuard {
  canActivate(context: McpExecutionContext): boolean {
    const args = context.getArgs();
    if (args.token !== 'valid-token') {
      throw new Error('Authentication required. Pass token: "valid-token"');
    }
    return true;
  }
}
