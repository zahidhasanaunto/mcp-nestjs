import { SetMetadata } from '@nestjs/common';
import { MCP_TOOL_METADATA } from '../mcp.constants';
import { McpToolOptions } from '../interfaces/tool.interfaces';

export function McpTool(options: McpToolOptions): MethodDecorator {
  return SetMetadata(MCP_TOOL_METADATA, options);
}
