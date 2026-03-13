import { SetMetadata } from '@nestjs/common';
import { MCP_GUARD_METADATA } from '../mcp.constants';
import { McpGuardType } from '../interfaces/guard.interfaces';

export function McpGuard(...guards: McpGuardType[]): ClassDecorator & MethodDecorator {
  return SetMetadata(MCP_GUARD_METADATA, guards);
}
