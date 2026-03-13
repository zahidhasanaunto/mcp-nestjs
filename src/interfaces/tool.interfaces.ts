export interface McpToolOptions {
  name?: string;
  description: string;
  schema?: any; // ZodType | JoiSchema | Record<string, InlinePropertyDef>
  transform?: 'auto' | 'raw' | ((result: any) => ToolResult);
  excludeProperties?: string[];
  requiredProperties?: string[];
}

export interface InlinePropertyDef {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  description?: string;
  default?: any;
  enum?: any[];
  items?: InlinePropertyDef;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

export interface JsonSchema {
  type: 'object';
  properties: Record<string, any>;
  required?: string[];
}

export interface ToolResult {
  content: ToolResultContent[];
  isError?: boolean;
}

export interface ToolResultContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
}

export interface ToolRegistration {
  definition: ToolDefinition;
  handler: (args: Record<string, any>, context: any) => Promise<ToolResult>;
}
