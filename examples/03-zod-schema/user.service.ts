import { Injectable } from '@nestjs/common';
import { McpTool } from '../../src';
import { z } from 'zod';

const CreateUserSchema = z.object({
  username: z.string().describe('Unique username'),
  email: z.string().describe('Email address'),
  role: z.enum(['admin', 'editor', 'viewer']).describe('User role'),
  age: z.number().optional().describe('User age'),
  tags: z.array(z.string()).optional().describe('User tags'),
});

const SearchUsersSchema = z.object({
  query: z.string().describe('Search query'),
  limit: z.number().default(10).describe('Max results'),
  sortBy: z.enum(['name', 'email', 'createdAt']).default('name'),
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;
type SearchUsersInput = z.infer<typeof SearchUsersSchema>;

const users: any[] = [];

@Injectable()
export class UserService {
  @McpTool({
    description: 'Create a new user account',
    schema: CreateUserSchema,
  })
  async createUser(args: CreateUserInput) {
    const user = { id: users.length + 1, ...args, createdAt: new Date().toISOString() };
    users.push(user);
    return user;
  }

  @McpTool({
    description: 'Search users by name or email',
    schema: SearchUsersSchema,
  })
  async searchUsers(args: SearchUsersInput) {
    const { query, limit, sortBy } = args;
    const results = users
      .filter(u => u.username.includes(query) || u.email.includes(query))
      .sort((a, b) => String(a[sortBy]).localeCompare(String(b[sortBy])))
      .slice(0, limit);
    return { results, total: results.length };
  }

  @McpTool({
    description: 'List all users',
  })
  async listUsers() {
    return { users, total: users.length };
  }
}
