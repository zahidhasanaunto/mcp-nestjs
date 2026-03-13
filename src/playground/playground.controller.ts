import { Controller, Get, Post, Body, Inject, Res } from '@nestjs/common';
import { Response } from 'express';
import { ToolRegistryService } from '../registry/tool-registry.service';
import { MCP_MODULE_OPTIONS } from '../mcp.constants';
import { McpModuleOptions } from '../interfaces/module-options.interfaces';
import { SessionManagerService } from '../transport/session-manager.service';
import { PLAYGROUND_HTML } from './playground.html';

@Controller('mcp-playground')
export class PlaygroundController {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly sessionManager: SessionManagerService,
    @Inject(MCP_MODULE_OPTIONS) private readonly options: McpModuleOptions,
  ) {}

  @Get()
  servePlayground(@Res() res: Response) {
    const html = PLAYGROUND_HTML
      .replace('{{SERVER_NAME}}', this.options.name)
      .replace('{{SERVER_VERSION}}', this.options.version);
    res.type('text/html').send(html);
  }

  @Get('api/info')
  getServerInfo() {
    return {
      name: this.options.name,
      version: this.options.version,
      transports: this.options.transports,
      sessions: this.sessionManager.getSessionCount(),
    };
  }

  @Get('api/tools')
  listTools() {
    return this.registry.getToolDefinitions();
  }

  @Get('api/resources')
  listResources() {
    return this.registry.getResourceDefinitions();
  }

  @Get('api/prompts')
  listPrompts() {
    return this.registry.getPromptDefinitions();
  }

  @Post('api/tools/call')
  async callTool(@Body() body: { name: string; arguments: Record<string, any> }) {
    const session = this.sessionManager.createSession();
    try {
      return await this.registry.executeTool(body.name, body.arguments || {}, session.id);
    } finally {
      this.sessionManager.deleteSession(session.id);
    }
  }

  @Post('api/resources/read')
  async readResource(@Body() body: { uri: string }) {
    const session = this.sessionManager.createSession();
    try {
      return await this.registry.executeResource(body.uri, session.id);
    } finally {
      this.sessionManager.deleteSession(session.id);
    }
  }

  @Post('api/prompts/get')
  async getPrompt(@Body() body: { name: string; arguments: Record<string, any> }) {
    const session = this.sessionManager.createSession();
    try {
      return await this.registry.executePrompt(body.name, body.arguments || {}, session.id);
    } finally {
      this.sessionManager.deleteSession(session.id);
    }
  }
}
