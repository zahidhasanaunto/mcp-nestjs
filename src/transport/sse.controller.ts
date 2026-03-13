import { Controller, Get, Post, Req, Res, Query, Inject, Optional } from '@nestjs/common';
import { Request, Response } from 'express';
import { ToolRegistryService } from '../registry/tool-registry.service';
import { SessionManagerService } from './session-manager.service';
import { MCP_MODULE_OPTIONS } from '../mcp.constants';
import { McpModuleOptions } from '../interfaces/module-options.interfaces';
import { JsonRpcHandler } from './json-rpc-handler';

@Controller()
export class SseController {
  private readonly jsonRpc: JsonRpcHandler;
  private readonly sseConnections = new Map<string, Response>();
  private readonly ssePath: string;
  private readonly messagesPath: string;

  constructor(
    private readonly registry: ToolRegistryService,
    private readonly sessionManager: SessionManagerService,
    @Inject(MCP_MODULE_OPTIONS) private readonly options: McpModuleOptions,
  ) {
    this.jsonRpc = new JsonRpcHandler(registry, options);
    this.ssePath = options.transports?.sse?.path || '/sse';
    this.messagesPath = this.ssePath.replace(/\/sse$/, '') + '/messages';
  }

  @Get('sse')
  handleSse(@Req() req: Request, @Res() res: Response) {
    if (!this.options.transports?.sse?.enabled) {
      res.status(404).json({ error: 'SSE transport not enabled' });
      return;
    }

    const session = this.sessionManager.createSession();

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send endpoint event
    res.write(`event: endpoint\ndata: ${this.messagesPath}?sessionId=${session.id}\n\n`);

    this.sseConnections.set(session.id, res);

    req.on('close', () => {
      this.sseConnections.delete(session.id);
      this.sessionManager.deleteSession(session.id);
    });
  }

  @Post('messages')
  async handleMessages(
    @Req() req: Request,
    @Res() res: Response,
    @Query('sessionId') sessionId: string,
  ) {
    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId' });
      return;
    }

    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const body = req.body;
    const response = await this.jsonRpc.handle(body, sessionId, req);

    // Send response via SSE
    const sseRes = this.sseConnections.get(sessionId);
    if (sseRes) {
      sseRes.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
    }

    res.status(202).json({ status: 'accepted' });
  }
}
