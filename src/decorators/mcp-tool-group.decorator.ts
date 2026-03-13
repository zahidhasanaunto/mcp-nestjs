import { SetMetadata } from '@nestjs/common';
import { MCP_TOOL_GROUP_METADATA } from '../mcp.constants';

export function McpToolGroup(prefix?: string): ClassDecorator {
  return SetMetadata(MCP_TOOL_GROUP_METADATA, prefix ?? true);
}
