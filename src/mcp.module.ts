import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { DiscoveryModule, Reflector } from '@nestjs/core';
import { MCP_MODULE_OPTIONS } from './mcp.constants';
import { McpModuleOptions, McpModuleAsyncOptions } from './interfaces/module-options.interfaces';
import { ToolRegistryService } from './registry/tool-registry.service';
import { ToolDiscoveryService } from './discovery/tool-discovery.service';
import { SchemaAdapterService } from './discovery/schema-adapter.service';
import { SessionManagerService } from './transport/session-manager.service';
import { SseController } from './transport/sse.controller';
import { StreamableHttpController } from './transport/streamable-http.controller';
import { StdioService } from './transport/stdio.service';
import { PlaygroundController } from './playground/playground.controller';

function isPlaygroundEnabled(options: McpModuleOptions): boolean {
  if (options.playground === true) return true;
  if (typeof options.playground === 'object') return options.playground.enabled !== false;
  return false;
}

@Module({})
export class McpModule {
  static forRoot(options: McpModuleOptions): DynamicModule {
    const controllers: Type[] = [];
    const imports: any[] = [];
    const needsDiscovery = options.discovery !== false;

    if (needsDiscovery) {
      imports.push(DiscoveryModule);
    }

    const providers: Provider[] = [
      { provide: MCP_MODULE_OPTIONS, useValue: options },
      Reflector,
      ToolRegistryService,
      SchemaAdapterService,
      SessionManagerService,
      {
        provide: 'MCP_INIT',
        useFactory: (sessionManager: SessionManagerService, registry: ToolRegistryService) => {
          sessionManager.configure(options.session);
          if (options.tools?.length) {
            registry.registerMany(options.tools);
          }
          if (options.guards?.length) {
            registry.setGlobalGuards(options.guards);
          }
        },
        inject: [SessionManagerService, ToolRegistryService],
      },
    ];

    if (options.transports?.sse?.enabled) {
      controllers.push(SseController);
    }
    if (options.transports?.http?.enabled) {
      controllers.push(StreamableHttpController);
    }
    if (options.transports?.stdio?.enabled) {
      providers.push(StdioService);
    }
    if (needsDiscovery) {
      providers.push(ToolDiscoveryService);
    }
    if (isPlaygroundEnabled(options)) {
      controllers.push(PlaygroundController);
    }

    return {
      module: McpModule,
      imports,
      controllers,
      providers,
      exports: [ToolRegistryService, SessionManagerService, SchemaAdapterService],
      global: true,
    };
  }

  static forRootAsync(options: McpModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: MCP_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      Reflector,
      ToolRegistryService,
      ToolDiscoveryService,
      SchemaAdapterService,
      SessionManagerService,
      SseController,
      StreamableHttpController,
      StdioService,
      PlaygroundController,
      {
        provide: 'MCP_INIT',
        useFactory: (
          mcpOptions: McpModuleOptions,
          sessionManager: SessionManagerService,
          registry: ToolRegistryService,
        ) => {
          sessionManager.configure(mcpOptions.session);
          if (mcpOptions.tools?.length) {
            registry.registerMany(mcpOptions.tools);
          }
          if (mcpOptions.guards?.length) {
            registry.setGlobalGuards(mcpOptions.guards);
          }
        },
        inject: [MCP_MODULE_OPTIONS, SessionManagerService, ToolRegistryService],
      },
    ];

    return {
      module: McpModule,
      imports: [DiscoveryModule, ...(options.imports || [])],
      controllers: [SseController, StreamableHttpController, PlaygroundController],
      providers,
      exports: [ToolRegistryService, SessionManagerService, SchemaAdapterService],
      global: true,
    };
  }

  static forFeature(featureProviders: Provider[]): DynamicModule {
    return {
      module: McpModule,
      providers: featureProviders,
      exports: featureProviders,
    };
  }
}
