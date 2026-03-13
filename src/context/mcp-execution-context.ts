import { McpExecutionContext } from '../interfaces/guard.interfaces';

export class McpExecutionContextImpl implements McpExecutionContext {
  constructor(
    private readonly sessionId: string | undefined,
    private readonly args: Record<string, any>,
    private readonly request: any,
    private readonly toolName: string,
    private readonly type: 'tool' | 'resource' | 'prompt',
  ) {}

  getSessionId(): string | undefined {
    return this.sessionId;
  }

  getArgs(): Record<string, any> {
    return this.args;
  }

  getRequest(): any {
    return this.request;
  }

  getToolName(): string {
    return this.toolName;
  }

  getType(): 'tool' | 'resource' | 'prompt' {
    return this.type;
  }
}
