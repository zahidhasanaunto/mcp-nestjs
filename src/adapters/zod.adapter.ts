import { JsonSchema } from '../interfaces/tool.interfaces';

export class ZodAdapter {
  convert(schema: any): JsonSchema {
    if (!schema || !schema._def) {
      return { type: 'object', properties: {} };
    }

    const shape = this.getShape(schema);
    if (!shape) {
      return { type: 'object', properties: {} };
    }

    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, zodField] of Object.entries<any>(shape)) {
      const prop = this.zodTypeToJsonSchema(zodField);
      properties[key] = prop;

      if (!this.isOptional(zodField)) {
        required.push(key);
      }
    }

    return { type: 'object', properties, required: required.length ? required : undefined };
  }

  private getShape(schema: any): Record<string, any> | null {
    const def = schema._def;
    // Zod v4: _def.shape is a plain object
    if (def.shape && typeof def.shape === 'object' && typeof def.shape !== 'function') {
      return def.shape;
    }
    // Zod v3: _def.shape() is a function
    if (typeof def.shape === 'function') {
      return def.shape();
    }
    return null;
  }

  private zodTypeToJsonSchema(zodType: any): any {
    if (!zodType?._def) return { type: 'string' };

    const typeName = this.getTypeName(zodType);

    // Unwrap optional/nullable/default wrappers
    if (typeName === 'optional' || typeName === 'nullable' || typeName === 'default'
      || typeName === 'ZodOptional' || typeName === 'ZodNullable' || typeName === 'ZodDefault') {
      return this.zodTypeToJsonSchema(zodType._def.innerType);
    }

    const base = this.zodTypeToJsonSchemaInner(zodType);

    // Zod v4: description is a top-level property
    if (zodType.description) {
      base.description = zodType.description;
    }
    // Zod v3: description is in _def
    else if (zodType._def.description) {
      base.description = zodType._def.description;
    }

    return base;
  }

  private zodTypeToJsonSchemaInner(zodType: any): any {
    const typeName = this.getTypeName(zodType);

    switch (typeName) {
      case 'string':
      case 'ZodString':
        return { type: 'string' };
      case 'number':
      case 'ZodNumber':
        return { type: 'number' };
      case 'boolean':
      case 'ZodBoolean':
        return { type: 'boolean' };
      case 'enum':
      case 'ZodEnum': {
        // Zod v4: _def.entries is an object { a: 'a', b: 'b' }
        // Zod v3: _def.values is an array ['a', 'b']
        const values = zodType._def.values || Object.values(zodType._def.entries || {});
        return { type: 'string', enum: values };
      }
      case 'array':
      case 'ZodArray': {
        const items = zodType._def.element || zodType._def.type;
        return {
          type: 'array',
          items: items ? this.zodTypeToJsonSchema(items) : { type: 'string' },
        };
      }
      case 'object':
      case 'ZodObject':
        return this.convert(zodType);
      default:
        return { type: 'string' };
    }
  }

  private getTypeName(zodType: any): string {
    // Zod v4: _def.type is a string like 'string', 'number', 'object', etc.
    // Zod v3: _def.typeName is like 'ZodString', 'ZodNumber', etc.
    return zodType._def.typeName || zodType._def.type || '';
  }

  private isOptional(zodType: any): boolean {
    if (!zodType?._def) return false;

    // Zod v4: has isOptional() method
    if (typeof zodType.isOptional === 'function') {
      return zodType.isOptional();
    }

    // Zod v3 fallback
    const typeName = this.getTypeName(zodType);
    if (typeName === 'ZodOptional' || typeName === 'optional') return true;
    if (typeName === 'ZodDefault' || typeName === 'default') return true;
    if (typeName === 'ZodNullable' || typeName === 'nullable') {
      return this.isOptional(zodType._def.innerType);
    }
    return false;
  }
}
