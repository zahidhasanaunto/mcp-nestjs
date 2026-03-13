import { Injectable } from '@nestjs/common';
import { McpTool, McpToolGroup } from '../../src';

@McpToolGroup('db')
@Injectable()
export class DatabaseService {
  private tables = new Map<string, any[]>([
    ['users', [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ]],
    ['orders', [
      { id: 1, userId: 1, item: 'Widget', amount: 29.99 },
      { id: 2, userId: 2, item: 'Gadget', amount: 49.99 },
    ]],
  ]);

  @McpTool({
    description: 'List all database tables',
  })
  async tables_list() {
    // Tool name becomes: db_tables_list
    return {
      tables: Array.from(this.tables.entries()).map(([name, rows]) => ({
        name,
        rowCount: rows.length,
      })),
    };
  }

  @McpTool({
    name: 'query', // explicit name → db_query
    description: 'Query a table with optional filters',
    schema: {
      table: { type: 'string', description: 'Table name', enum: ['users', 'orders'] },
      where: { type: 'object', description: 'Filter conditions as JSON (e.g. {"name":"Alice"})', required: false },
      limit: { type: 'number', description: 'Max rows to return', default: 100, required: false },
    },
  })
  async query(args: { table: string; where?: Record<string, any>; limit?: number }) {
    const rows = this.tables.get(args.table);
    if (!rows) throw new Error(`Table not found: ${args.table}`);

    let results = rows;
    if (args.where) {
      results = results.filter(row =>
        Object.entries(args.where!).every(([k, v]) => row[k] === v),
      );
    }
    if (args.limit) {
      results = results.slice(0, args.limit);
    }

    return { table: args.table, results, count: results.length };
  }
}
