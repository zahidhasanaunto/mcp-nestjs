import { Injectable, Logger } from '@nestjs/common';
import { ToolRegistration, ToolDefinition, ToolResult } from '../interfaces/tool.interfaces';
import { ResourceRegistration, ResourceDefinition, ResourceResult } from '../interfaces/resource.interfaces';
import { PromptRegistration, PromptDefinition, PromptResult } from '../interfaces/prompt.interfaces';
import { McpGuardType } from '../interfaces/guard.interfaces';
import { McpExecutionContextImpl } from '../context/mcp-execution-context';

@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);
  private readonly tools = new Map<string, ToolRegistration>();
  private readonly resources = new Map<string, ResourceRegistration>();
  private readonly prompts = new Map<string, PromptRegistration>();
  private globalGuards: McpGuardType[] = [];

  setGlobalGuards(guards: McpGuardType[]) {
    this.globalGuards = guards;
  }

  registerTool(registration: ToolRegistration) {
    const name = registration.definition.name;
    if (this.tools.has(name)) {
      this.logger.warn(`Tool "${name}" already registered, overwriting`);
    }
    this.tools.set(name, registration);
    this.logger.log(`Registered tool: ${name}`);
  }

  registerMany(registrations: ToolRegistration[]) {
    for (const reg of registrations) {
      this.registerTool(reg);
    }
  }

  registerResource(registration: ResourceRegistration) {
    const key = registration.definition.uri || registration.definition.uriTemplate || registration.definition.name;
    this.resources.set(key, registration);
    this.logger.log(`Registered resource: ${key}`);
  }

  registerPrompt(registration: PromptRegistration) {
    const name = registration.definition.name;
    this.prompts.set(name, registration);
    this.logger.log(`Registered prompt: ${name}`);
  }

  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  getResourceDefinitions(): ResourceDefinition[] {
    return Array.from(this.resources.values()).map(r => r.definition);
  }

  getPromptDefinitions(): PromptDefinition[] {
    return Array.from(this.prompts.values()).map(p => p.definition);
  }

  async executeTool(
    name: string,
    args: Record<string, any>,
    sessionId: string,
    request?: any,
  ): Promise<ToolResult> {
    const registration = this.tools.get(name);
    if (!registration) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    const context = new McpExecutionContextImpl(sessionId, args, request, name, 'tool');

    try {
      return await registration.handler(args, context);
    } catch (error: any) {
      this.logger.error(`Tool "${name}" execution failed: ${error.message}`);
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }

  async executeResource(uri: string, sessionId: string, request?: any): Promise<ResourceResult> {
    // Try exact match first
    let registration = this.resources.get(uri);

    // Try template matching
    if (!registration) {
      for (const [, reg] of this.resources) {
        if (reg.definition.uriTemplate && this.matchTemplate(reg.definition.uriTemplate, uri)) {
          registration = reg;
          break;
        }
      }
    }

    if (!registration) {
      throw new Error(`Unknown resource: ${uri}`);
    }

    const context = new McpExecutionContextImpl(sessionId, {}, request, uri, 'resource');
    return registration.handler(uri, context);
  }

  async executePrompt(
    name: string,
    args: Record<string, any>,
    sessionId: string,
    request?: any,
  ): Promise<PromptResult> {
    const registration = this.prompts.get(name);
    if (!registration) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    const context = new McpExecutionContextImpl(sessionId, args, request, name, 'prompt');
    return registration.handler(args, context);
  }

  private matchTemplate(template: string, uri: string): boolean {
    const regex = template.replace(/\{[^}]+\}/g, '([^/]+)');
    return new RegExp(`^${regex}$`).test(uri);
  }

  getToolCount(): number {
    return this.tools.size;
  }

  getResourceCount(): number {
    return this.resources.size;
  }

  getPromptCount(): number {
    return this.prompts.size;
  }
}
