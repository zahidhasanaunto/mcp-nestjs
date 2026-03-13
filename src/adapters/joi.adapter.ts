import { JsonSchema } from '../interfaces/tool.interfaces';

export class JoiAdapter {
  convert(schema: any): JsonSchema {
    if (!schema || !schema.describe) {
      return { type: 'object', properties: {} };
    }

    const description = schema.describe();
    return this.joiDescToJsonSchema(description) as JsonSchema;
  }

  private joiDescToJsonSchema(desc: any): any {
    if (!desc) return { type: 'string' };

    switch (desc.type) {
      case 'object': {
        const properties: Record<string, any> = {};
        const required: string[] = [];
        const children = desc.keys || {};

        for (const [key, child] of Object.entries<any>(children)) {
          properties[key] = this.joiDescToJsonSchema(child);
          // Joi marks presence: 'required' for required fields
          if (child.flags?.presence === 'required') {
            required.push(key);
          }
        }

        return { type: 'object', properties, required: required.length ? required : undefined };
      }
      case 'string': {
        const result: any = { type: 'string' };
        if (desc.allow) result.enum = desc.allow.filter((v: any) => v !== '');
        return result;
      }
      case 'number': return { type: 'number' };
      case 'boolean': return { type: 'boolean' };
      case 'array': {
        const result: any = { type: 'array' };
        if (desc.items?.[0]) {
          result.items = this.joiDescToJsonSchema(desc.items[0]);
        }
        return result;
      }
      default: return { type: 'string' };
    }
  }
}
