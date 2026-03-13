import { ModuleMetadata, Type } from '@nestjs/common';
import { ToolRegistration } from './tool.interfaces';
import { McpGuardType } from './guard.interfaces';

export interface TransportConfig {
  sse?: {
    enabled?: boolean;
    path?: string;
  };
  http?: {
    enabled?: boolean;
    path?: string;
  };
  stdio?: {
    enabled?: boolean;
  };
}

export interface SessionConfig {
  timeout?: number;       // ms, default 30min
  cleanupInterval?: number; // ms, default 5min
  maxSessions?: number;   // default 1000
}

export interface PlaygroundConfig {
  enabled?: boolean;
  path?: string; // default: '/mcp-playground'
}

export interface McpModuleOptions {
  name: string;
  version: string;
  transports?: TransportConfig;
  tools?: ToolRegistration[];
  guards?: McpGuardType[];
  session?: SessionConfig;
  playground?: boolean | PlaygroundConfig;
}

export interface McpModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => McpModuleOptions | Promise<McpModuleOptions>;
  inject?: any[];
}
