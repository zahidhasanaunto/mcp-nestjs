import { ToolRegistryService } from '../registry/tool-registry.service';
import { McpModuleOptions } from '../interfaces/module-options.interfaces';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: { code: number; message: string; data?: any };
}

export class JsonRpcHandler {
  constructor(
    private readonly registry: ToolRegistryService,
    private readonly options: McpModuleOptions,
  ) {}

  async handle(request: JsonRpcRequest, sessionId: string, rawRequest?: any): Promise<JsonRpcResponse> {
    const { id, method, params } = request;

    try {
      switch (method) {
        case 'initialize':
          return this.response(id, {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: { listChanged: false },
              resources: { subscribe: false, listChanged: false },
              prompts: { listChanged: false },
            },
            serverInfo: {
              name: this.options.name,
              version: this.options.version,
            },
          });

        case 'notifications/initialized':
          // Client acknowledgment, no response needed for notifications
          return this.response(id, {});

        case 'tools/list':
          return this.response(id, {
            tools: this.registry.getToolDefinitions(),
          });

        case 'tools/call': {
          const { name, arguments: args = {} } = params || {};
          const result = await this.registry.executeTool(name, args, sessionId, rawRequest);
          return this.response(id, result);
        }

        case 'resources/list':
          return this.response(id, {
            resources: this.registry.getResourceDefinitions().filter(r => r.uri),
          });

        case 'resources/templates/list':
          return this.response(id, {
            resourceTemplates: this.registry.getResourceDefinitions().filter(r => r.uriTemplate),
          });

        case 'resources/read': {
          const { uri } = params || {};
          const result = await this.registry.executeResource(uri, sessionId, rawRequest);
          return this.response(id, result);
        }

        case 'prompts/list':
          return this.response(id, {
            prompts: this.registry.getPromptDefinitions(),
          });

        case 'prompts/get': {
          const { name, arguments: args = {} } = params || {};
          const result = await this.registry.executePrompt(name, args, sessionId, rawRequest);
          return this.response(id, result);
        }

        case 'ping':
          return this.response(id, {});

        default:
          return this.error(id, -32601, `Method not found: ${method}`);
      }
    } catch (error: any) {
      return this.error(id, -32603, error.message);
    }
  }

  private response(id: string | number | undefined, result: any): JsonRpcResponse {
    return { jsonrpc: '2.0', id, result };
  }

  private error(id: string | number | undefined, code: number, message: string): JsonRpcResponse {
    return { jsonrpc: '2.0', id, error: { code, message } };
  }
}
