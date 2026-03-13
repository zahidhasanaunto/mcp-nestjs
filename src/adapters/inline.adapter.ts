import { JsonSchema, InlinePropertyDef } from '../interfaces/tool.interfaces';

export class InlineAdapter {
  convert(schema: Record<string, InlinePropertyDef>): JsonSchema {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, def] of Object.entries(schema)) {
      const prop: any = { type: def.type };
      if (def.description) prop.description = def.description;
      if (def.default !== undefined) prop.default = def.default;
      if (def.enum) prop.enum = def.enum;
      if (def.type === 'array' && def.items) {
        prop.items = { type: def.items.type };
        if (def.items.description) prop.items.description = def.items.description;
      }
      properties[key] = prop;
      if (def.required !== false) {
        required.push(key);
      }
    }

    return { type: 'object', properties, required: required.length ? required : undefined };
  }
}
