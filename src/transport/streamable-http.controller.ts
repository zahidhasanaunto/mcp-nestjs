import { Controller, Post, Req, Res, Headers, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { ToolRegistryService } from '../registry/tool-registry.service';
import { SessionManagerService } from './session-manager.service';
import { MCP_MODULE_OPTIONS } from '../mcp.constants';
import { McpModuleOptions } from '../interfaces/module-options.interfaces';
import { JsonRpcHandler } from './json-rpc-handler';

@Controller()
export class StreamableHttpController {
  private readonly jsonRpc: JsonRpcHandler;

  constructor(
    private readonly registry: ToolRegistryService,
    private readonly sessionManager: SessionManagerService,
    @Inject(MCP_MODULE_OPTIONS) private readonly options: McpModuleOptions,
  ) {
    this.jsonRpc = new JsonRpcHandler(registry, options);
  }

  @Post('mcp')
  async handleMcp(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('mcp-session-id') sessionId?: string,
  ) {
    if (!this.options.transports?.http?.enabled) {
      res.status(404).json({ error: 'HTTP transport not enabled' });
      return;
    }

    // Get or create session
    let actualSessionId: string;
    if (sessionId) {
      const session = this.sessionManager.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      actualSessionId = session.id;
    } else {
      const session = this.sessionManager.createSession();
      actualSessionId = session.id;
    }

    const body = req.body;
    const response = await this.jsonRpc.handle(body, actualSessionId, req);

    res.setHeader('mcp-session-id', actualSessionId);
    res.json(response);
  }
}
