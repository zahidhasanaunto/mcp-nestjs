import { Injectable, OnModuleInit } from '@nestjs/common';
import { ToolRegistryService } from '../../src';

/**
 * Demonstrates registering tools dynamically at runtime
 * via ToolRegistryService injection.
 */
@Injectable()
export class DynamicToolService implements OnModuleInit {
  constructor(private readonly registry: ToolRegistryService) {}

  onModuleInit() {
    // Register tools from some dynamic source (config, database, etc.)
    const dynamicTools = this.buildToolsFromConfig();
    this.registry.registerMany(dynamicTools);
  }

  private buildToolsFromConfig() {
    // Simulate loading tool definitions from config
    const conversions = [
      { from: 'celsius', to: 'fahrenheit', formula: (v: number) => v * 9 / 5 + 32 },
      { from: 'fahrenheit', to: 'celsius', formula: (v: number) => (v - 32) * 5 / 9 },
      { from: 'km', to: 'miles', formula: (v: number) => v * 0.621371 },
      { from: 'miles', to: 'km', formula: (v: number) => v * 1.60934 },
      { from: 'kg', to: 'lbs', formula: (v: number) => v * 2.20462 },
      { from: 'lbs', to: 'kg', formula: (v: number) => v * 0.453592 },
    ];

    return conversions.map(conv => ({
      definition: {
        name: `convert_${conv.from}_to_${conv.to}`,
        description: `Convert ${conv.from} to ${conv.to}`,
        inputSchema: {
          type: 'object' as const,
          properties: {
            value: { type: 'number', description: `Value in ${conv.from}` },
          },
          required: ['value'],
        },
      },
      handler: async (args: { value: number }) => {
        const result = conv.formula(args.value);
        return {
          content: [{
            type: 'text' as const,
            text: `${args.value} ${conv.from} = ${result.toFixed(2)} ${conv.to}`,
          }],
        };
      },
    }));
  }
}
