import { SetMetadata } from '@nestjs/common';
import { MCP_PROMPT_METADATA } from '../mcp.constants';
import { McpPromptOptions } from '../interfaces/prompt.interfaces';

export function McpPrompt(options: McpPromptOptions): MethodDecorator {
  return SetMetadata(MCP_PROMPT_METADATA, options);
}
