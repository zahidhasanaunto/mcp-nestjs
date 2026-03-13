export interface McpPromptOptions {
  name: string;
  description?: string;
  schema?: any; // ZodType | JoiSchema | Record<string, InlinePropertyDef>
}

export interface PromptDefinition {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface PromptResult {
  messages: Array<{
    role: 'user' | 'assistant';
    content: {
      type: 'text' | 'image' | 'resource';
      text?: string;
      data?: string;
      mimeType?: string;
    };
  }>;
}

export interface PromptRegistration {
  definition: PromptDefinition;
  handler: (args: Record<string, any>, context: any) => Promise<PromptResult>;
}
