import { Injectable } from '@nestjs/common';
import { McpTool } from '../../src';

@Injectable()
export class CalculatorService {
  @McpTool({
    description: 'Perform arithmetic on two numbers',
    schema: {
      a: { type: 'number', description: 'First operand' },
      b: { type: 'number', description: 'Second operand' },
      operation: {
        type: 'string',
        description: 'Math operation',
        enum: ['add', 'subtract', 'multiply', 'divide'],
      },
    },
  })
  async calculate(args: { a: number; b: number; operation: string }) {
    const { a, b, operation } = args;
    let result: number;
    switch (operation) {
      case 'add': result = a + b; break;
      case 'subtract': result = a - b; break;
      case 'multiply': result = a * b; break;
      case 'divide':
        if (b === 0) throw new Error('Division by zero');
        result = a / b;
        break;
      default: throw new Error(`Unknown operation: ${operation}`);
    }
    return { expression: `${a} ${operation} ${b}`, result };
  }

  @McpTool({
    description: 'Generate a summary of numbers',
    schema: {
      numbers: {
        type: 'array',
        description: 'List of numbers to analyze',
        items: { type: 'number' },
      },
      includeMedian: {
        type: 'boolean',
        description: 'Whether to include the median',
        required: false,
      },
      precision: {
        type: 'number',
        description: 'Decimal places to round to',
        default: 2,
        required: false,
      },
    },
  })
  async summarizeNumbers(args: { numbers: number[]; includeMedian?: boolean; precision?: number }) {
    const { numbers, includeMedian = false, precision = 2 } = args;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    const result: any = {
      count: numbers.length,
      sum: +sum.toFixed(precision),
      mean: +mean.toFixed(precision),
      min,
      max,
    };

    if (includeMedian) {
      const mid = Math.floor(sorted.length / 2);
      result.median = sorted.length % 2 ? sorted[mid] : +(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(precision));
    }

    return result;
  }
}
