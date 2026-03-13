import { Injectable } from '@nestjs/common';
import { McpResource } from '../../src';

@Injectable()
export class ResourceProvider {
  private users = [
    { id: '1', name: 'Alice', email: 'alice@example.com', role: 'admin' },
    { id: '2', name: 'Bob', email: 'bob@example.com', role: 'editor' },
    { id: '3', name: 'Charlie', email: 'charlie@example.com', role: 'viewer' },
  ];

  private logs = [
    { ts: '2026-03-12T10:00:00Z', level: 'info', message: 'Server started' },
    { ts: '2026-03-12T10:01:00Z', level: 'warn', message: 'High memory usage' },
    { ts: '2026-03-12T10:02:00Z', level: 'error', message: 'Connection timeout' },
    { ts: '2026-03-12T10:03:00Z', level: 'info', message: 'Request processed' },
  ];

  // Static resource — always returns the same URI
  @McpResource({
    uri: 'config://app',
    name: 'app_config',
    description: 'Application configuration',
    mimeType: 'application/json',
  })
  async getConfig() {
    return {
      contents: [{
        uri: 'config://app',
        mimeType: 'application/json',
        text: JSON.stringify({
          appName: 'resources-example',
          environment: 'development',
          debug: true,
          maxConnections: 100,
          features: { notifications: true, analytics: false },
        }, null, 2),
      }],
    };
  }

  // Static resource — live data snapshot
  @McpResource({
    uri: 'metrics://current',
    name: 'current_metrics',
    description: 'Current server metrics snapshot',
    mimeType: 'application/json',
  })
  async getMetrics() {
    return {
      contents: [{
        uri: 'metrics://current',
        mimeType: 'application/json',
        text: JSON.stringify({
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          timestamp: new Date().toISOString(),
        }, null, 2),
      }],
    };
  }

  // Parameterized resource — URI template with {userId}
  @McpResource({
    uriTemplate: 'users://{userId}',
    name: 'user_detail',
    description: 'Get user details by ID',
    mimeType: 'application/json',
  })
  async getUser(uri: string) {
    const match = uri.match(/users:\/\/(.+)/);
    const userId = match?.[1];
    const user = this.users.find(u => u.id === userId);

    if (!user) {
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'User not found' }),
        }],
      };
    }

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(user, null, 2),
      }],
    };
  }

  // Static resource — list of all users
  @McpResource({
    uri: 'users://list',
    name: 'users_list',
    description: 'List all users',
    mimeType: 'application/json',
  })
  async listUsers() {
    return {
      contents: [{
        uri: 'users://list',
        mimeType: 'application/json',
        text: JSON.stringify(this.users, null, 2),
      }],
    };
  }

  // Parameterized resource — filter logs by level
  @McpResource({
    uriTemplate: 'logs://{level}',
    name: 'logs_by_level',
    description: 'Get logs filtered by level (info, warn, error)',
    mimeType: 'application/json',
  })
  async getLogsByLevel(uri: string) {
    const match = uri.match(/logs:\/\/(.+)/);
    const level = match?.[1];
    const filtered = this.logs.filter(l => l.level === level);

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({ level, logs: filtered, count: filtered.length }, null, 2),
      }],
    };
  }
}
