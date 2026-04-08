import { Injectable, Logger } from '@nestjs/common';
import { JsonSchema } from '../interfaces/tool.interfaces';
import { InlineAdapter } from '../adapters/inline.adapter';
import { ZodAdapter } from '../adapters/zod.adapter';
import { JoiAdapter } from '../adapters/joi.adapter';
import { ClassValidatorAdapter } from '../adapters/class-validator.adapter';

@Injectable()
export class SchemaAdapterService {
  private readonly logger = new Logger(SchemaAdapterService.name);
  private readonly inlineAdapter = new InlineAdapter();
  private zodAdapter: ZodAdapter | null = null;
  private joiAdapter: JoiAdapter | null = null;
  private classValidatorAdapter: ClassValidatorAdapter | null = null;

  private hasZod = false;
  private hasJoi = false;
  private hasClassValidator = false;

  onModuleInit() {
    this.detectLibraries();
  }

  private detectLibraries() {
    try {
      require.resolve('zod');
      this.hasZod = true;
      this.zodAdapter = new ZodAdapter();
      this.logger.log('Zod detected — schema adapter enabled');
    } catch { /* not installed */ }

    try {
      require.resolve('joi');
      this.hasJoi = true;
      this.joiAdapter = new JoiAdapter();
      this.logger.log('Joi detected — schema adapter enabled');
    } catch { /* not installed */ }

    try {
      require.resolve('class-validator');
      this.hasClassValidator = true;
      this.classValidatorAdapter = new ClassValidatorAdapter();
      this.logger.log('class-validator detected — schema adapter enabled');
    } catch { /* not installed */ }
  }

  convert(schema: any): JsonSchema {
    if (!schema) {
      return { type: 'object', properties: {} };
    }

    // Check if it's a Zod type
    // Zod v3: _def.typeName exists; Zod v4: _def.type is a string (e.g. 'object')
    if (this.hasZod && schema._def && (schema._def.typeName || typeof schema._def.type === 'string')) {
      return this.zodAdapter!.convert(schema);
    }

    // Check if it's a Joi schema (has describe method and type)
    if (this.hasJoi && typeof schema.describe === 'function' && schema._flags) {
      return this.joiAdapter!.convert(schema);
    }

    // Check if it's a class (constructor function) — class-validator DTO
    if (this.hasClassValidator && typeof schema === 'function') {
      return this.classValidatorAdapter!.convert(schema);
    }

    // Plain object — inline adapter
    if (typeof schema === 'object' && !Array.isArray(schema)) {
      return this.inlineAdapter.convert(schema);
    }

    return { type: 'object', properties: {} };
  }
}
