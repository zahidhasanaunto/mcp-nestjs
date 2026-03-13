import { SetMetadata } from '@nestjs/common';
import { MCP_RESOURCE_METADATA } from '../mcp.constants';
import { McpResourceOptions, McpResourceTemplateOptions } from '../interfaces/resource.interfaces';

export function McpResource(options: McpResourceOptions | McpResourceTemplateOptions): MethodDecorator {
  return SetMetadata(MCP_RESOURCE_METADATA, options);
}
