export interface McpExecutionContext {
  getSessionId(): string;
  getArgs(): Record<string, any>;
  getRequest(): any;
  getToolName(): string;
  getType(): 'tool' | 'resource' | 'prompt';
}

export interface McpGuard {
  canActivate(context: McpExecutionContext): boolean | Promise<boolean>;
}

export type McpGuardType = new (...args: any[]) => McpGuard;
