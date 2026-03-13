export interface McpResourceOptions {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface McpResourceTemplateOptions {
  uriTemplate: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface ResourceDefinition {
  uri?: string;
  uriTemplate?: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface ResourceResult {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}

export interface ResourceRegistration {
  definition: ResourceDefinition;
  handler: (uri: string, context: any) => Promise<ResourceResult>;
}
