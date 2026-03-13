import { JsonSchema } from '../interfaces/tool.interfaces';

export class ZodAdapter {
  convert(schema: any): JsonSchema {
    // ZodObject → JSON Schema via shape introspection
    if (!schema || !schema._def) {
      return { type: 'object', properties: {} };
    }

    const shape = schema._def.shape?.() ?? schema._def.shape ?? {};
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, zodField] of Object.entries<any>(shape)) {
      const prop = this.zodTypeToJsonSchema(zodField);
      properties[key] = prop;

      // ZodOptional wraps in .optional(), unwrapped types are required
      if (!this.isOptional(zodField)) {
        required.push(key);
      }
    }

    return { type: 'object', properties, required: required.length ? required : undefined };
  }

  private zodTypeToJsonSchema(zodType: any): any {
    if (!zodType?._def) return { type: 'string' };

    const typeName = zodType._def.typeName;

    // Unwrap optional/nullable/default wrappers
    if (typeName === 'ZodOptional' || typeName === 'ZodNullable' || typeName === 'ZodDefault') {
      return this.zodTypeToJsonSchema(zodType._def.innerType);
    }

    if (zodType._def.description) {
      const base = this.zodTypeToJsonSchemaInner(zodType);
      base.description = zodType._def.description;
      return base;
    }

    return this.zodTypeToJsonSchemaInner(zodType);
  }

  private zodTypeToJsonSchemaInner(zodType: any): any {
    const typeName = zodType._def.typeName;

    switch (typeName) {
      case 'ZodString': return { type: 'string' };
      case 'ZodNumber': return { type: 'number' };
      case 'ZodBoolean': return { type: 'boolean' };
      case 'ZodEnum': return { type: 'string', enum: zodType._def.values };
      case 'ZodArray': return {
        type: 'array',
        items: this.zodTypeToJsonSchema(zodType._def.type),
      };
      case 'ZodObject': return this.convert(zodType);
      default: return { type: 'string' };
    }
  }

  private isOptional(zodType: any): boolean {
    if (!zodType?._def) return false;
    const typeName = zodType._def.typeName;
    if (typeName === 'ZodOptional') return true;
    if (typeName === 'ZodDefault') return true;
    if (typeName === 'ZodNullable') return this.isOptional(zodType._def.innerType);
    return false;
  }
}
