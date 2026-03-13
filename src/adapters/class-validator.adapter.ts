import { JsonSchema } from '../interfaces/tool.interfaces';

export class ClassValidatorAdapter {
  convert(dtoClass: any): JsonSchema {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getMetadataStorage } = require('class-validator');
      const storage = getMetadataStorage();
      const metadatas = storage.getTargetValidationMetadatas(dtoClass, '', false, false);

      // Collect property names and their validation rules
      const propertyMap = new Map<string, any[]>();
      for (const meta of metadatas) {
        if (!propertyMap.has(meta.propertyName)) {
          propertyMap.set(meta.propertyName, []);
        }
        propertyMap.get(meta.propertyName)!.push(meta);
      }

      for (const [propName, metas] of propertyMap) {
        const prop: any = { type: 'string' }; // default

        for (const meta of metas) {
          switch (meta.name) {
            case 'isString': prop.type = 'string'; break;
            case 'isNumber':
            case 'isInt': prop.type = 'number'; break;
            case 'isBoolean': prop.type = 'boolean'; break;
            case 'isArray': prop.type = 'array'; break;
            case 'isNotEmpty':
            case 'isDefined':
              if (!required.includes(propName)) required.push(propName);
              break;
            case 'isOptional':
              // Remove from required if previously added
              const idx = required.indexOf(propName);
              if (idx !== -1) required.splice(idx, 1);
              break;
            case 'isEnum':
              if (meta.constraints?.[0]) {
                prop.enum = Object.values(meta.constraints[0]);
              }
              break;
          }
        }

        properties[propName] = prop;
      }

      // Also try reflect metadata for types
      try {
        const instance = new dtoClass();
        for (const key of Object.keys(properties)) {
          const designType = Reflect.getMetadata('design:type', instance, key);
          if (designType === String) properties[key].type = 'string';
          else if (designType === Number) properties[key].type = 'number';
          else if (designType === Boolean) properties[key].type = 'boolean';
        }
      } catch {
        // ignore if can't instantiate
      }
    } catch {
      // class-validator not available
    }

    return { type: 'object', properties, required: required.length ? required : undefined };
  }
}
