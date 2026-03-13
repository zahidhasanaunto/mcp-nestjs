import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { MCP_TOOL_METADATA, MCP_TOOL_GROUP_METADATA, MCP_RESOURCE_METADATA, MCP_PROMPT_METADATA } from '../mcp.constants';
import { McpToolOptions, ToolRegistration, ToolResult, JsonSchema } from '../interfaces/tool.interfaces';
import { McpResourceOptions, McpResourceTemplateOptions } from '../interfaces/resource.interfaces';
import { McpPromptOptions } from '../interfaces/prompt.interfaces';
import { ToolRegistryService } from '../registry/tool-registry.service';
import { SchemaAdapterService } from './schema-adapter.service';

@Injectable()
export class ToolDiscoveryService implements OnModuleInit {
  private readonly logger = new Logger(ToolDiscoveryService.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly registry: ToolRegistryService,
    private readonly schemaAdapter: SchemaAdapterService,
  ) {}

  onModuleInit() {
    this.schemaAdapter.onModuleInit();
    this.discoverTools();
    this.discoverResources();
    this.discoverPrompts();
    this.logger.log(
      `Discovery complete: ${this.registry.getToolCount()} tools, ` +
      `${this.registry.getResourceCount()} resources, ` +
      `${this.registry.getPromptCount()} prompts`,
    );
  }

  private discoverTools() {
    const wrappers = [
      ...this.discoveryService.getControllers(),
      ...this.discoveryService.getProviders(),
    ];

    for (const wrapper of wrappers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') continue;

      const prototype = Object.getPrototypeOf(instance);
      const groupPrefix = this.reflector.get<string | true>(MCP_TOOL_GROUP_METADATA, instance.constructor);

      const methodNames = this.metadataScanner.getAllMethodNames(prototype);
      for (const methodName of methodNames) {
        const toolOptions = this.reflector.get<McpToolOptions>(MCP_TOOL_METADATA, prototype[methodName]);
        if (!toolOptions) continue;

        const registration = this.buildToolRegistration(instance, methodName, toolOptions, groupPrefix);
        this.registry.registerTool(registration);
      }
    }
  }

  private buildToolRegistration(
    instance: any,
    methodName: string,
    options: McpToolOptions,
    groupPrefix?: string | true,
  ): ToolRegistration {
    // Determine tool name
    let prefix = '';
    if (typeof groupPrefix === 'string') {
      prefix = groupPrefix + '_';
    } else if (groupPrefix === true) {
      // Auto-derive from controller path
      const controllerPath = Reflect.getMetadata('path', instance.constructor);
      if (controllerPath) {
        // api/v1/features → features
        const segments = controllerPath.replace(/^\/|\/$/g, '').split('/');
        prefix = segments[segments.length - 1] + '_';
      }
    }

    const toolName = options.name || `${prefix}${methodName}`;

    // Build schema
    let inputSchema: JsonSchema;
    if (options.schema) {
      inputSchema = this.schemaAdapter.convert(options.schema);
    } else {
      // Try to infer from route args metadata (controller methods)
      inputSchema = this.inferSchemaFromMethod(instance, methodName);
    }

    // Apply excludeProperties
    if (options.excludeProperties?.length && inputSchema.properties) {
      for (const prop of options.excludeProperties) {
        delete inputSchema.properties[prop];
        if (inputSchema.required) {
          inputSchema.required = inputSchema.required.filter(r => r !== prop);
        }
      }
    }

    // Apply requiredProperties override
    if (options.requiredProperties) {
      inputSchema.required = options.requiredProperties;
    }

    const handler = async (args: Record<string, any>): Promise<ToolResult> => {
      try {
        const result = await instance[methodName](args);
        return this.transformResult(result, options.transform);
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    };

    return {
      definition: {
        name: toolName,
        description: options.description,
        inputSchema,
      },
      handler,
    };
  }

  private inferSchemaFromMethod(instance: any, methodName: string): JsonSchema {
    // Try reading NestJS route args metadata
    const argsMetadata = Reflect.getMetadata('__routeArguments__', instance.constructor, methodName);
    if (!argsMetadata) {
      // Try reading parameter types via reflect-metadata
      const paramTypes = Reflect.getMetadata('design:paramtypes', instance, methodName);
      if (paramTypes?.length === 1 && typeof paramTypes[0] === 'function' && paramTypes[0] !== Object) {
        return this.schemaAdapter.convert(paramTypes[0]);
      }
      return { type: 'object', properties: {} };
    }

    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const key of Object.keys(argsMetadata)) {
      const arg = argsMetadata[key];
      // arg.data is the parameter name for @Param/@Query, arg.index is position
      if (arg.data) {
        properties[arg.data] = { type: 'string' };
        required.push(arg.data);
      }
    }

    return { type: 'object', properties, required: required.length ? required : undefined };
  }

  private transformResult(result: any, transform?: McpToolOptions['transform']): ToolResult {
    if (transform === 'raw') {
      return result as ToolResult;
    }

    if (typeof transform === 'function') {
      return transform(result);
    }

    // Auto mode (default)
    if (result === null || result === undefined) {
      return { content: [{ type: 'text', text: 'null' }] };
    }

    // Already a ToolResult
    if (result.content && Array.isArray(result.content)) {
      return result;
    }

    // Unwrap common patterns
    const data = result.data !== undefined ? result.data : result;
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    return { content: [{ type: 'text', text }] };
  }

  private discoverResources() {
    const wrappers = [
      ...this.discoveryService.getControllers(),
      ...this.discoveryService.getProviders(),
    ];

    for (const wrapper of wrappers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') continue;

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methodNames) {
        const resourceOptions = this.reflector.get<McpResourceOptions | McpResourceTemplateOptions>(
          MCP_RESOURCE_METADATA, prototype[methodName],
        );
        if (!resourceOptions) continue;

        this.registry.registerResource({
          definition: {
            uri: (resourceOptions as McpResourceOptions).uri,
            uriTemplate: (resourceOptions as McpResourceTemplateOptions).uriTemplate,
            name: resourceOptions.name,
            description: resourceOptions.description,
            mimeType: resourceOptions.mimeType,
          },
          handler: async (uri, context) => instance[methodName](uri, context),
        });
      }
    }
  }

  private discoverPrompts() {
    const wrappers = [
      ...this.discoveryService.getControllers(),
      ...this.discoveryService.getProviders(),
    ];

    for (const wrapper of wrappers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') continue;

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methodNames) {
        const promptOptions = this.reflector.get<McpPromptOptions>(
          MCP_PROMPT_METADATA, prototype[methodName],
        );
        if (!promptOptions) continue;

        let args: Array<{ name: string; description?: string; required?: boolean }> | undefined;
        if (promptOptions.schema) {
          const schema = this.schemaAdapter.convert(promptOptions.schema);
          args = Object.entries(schema.properties).map(([name, prop]: [string, any]) => ({
            name,
            description: prop.description,
            required: schema.required?.includes(name),
          }));
        }

        this.registry.registerPrompt({
          definition: {
            name: promptOptions.name,
            description: promptOptions.description,
            arguments: args,
          },
          handler: async (promptArgs, context) => instance[methodName](promptArgs, context),
        });
      }
    }
  }
}
