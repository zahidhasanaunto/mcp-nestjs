import 'reflect-metadata';
import { McpTool } from './mcp-tool.decorator';
import { McpToolGroup } from './mcp-tool-group.decorator';
import { McpResource } from './mcp-resource.decorator';
import { McpPrompt } from './mcp-prompt.decorator';
import { McpGuard } from './mcp-guard.decorator';
import { MCP_TOOL_METADATA, MCP_TOOL_GROUP_METADATA, MCP_RESOURCE_METADATA, MCP_PROMPT_METADATA, MCP_GUARD_METADATA } from '../mcp.constants';

describe('Decorators', () => {
  describe('@McpTool', () => {
    it('sets metadata on method', () => {
      class TestClass {
        @McpTool({ description: 'Test tool', name: 'custom_name' })
        myMethod() {}
      }

      const metadata = Reflect.getMetadata(MCP_TOOL_METADATA, TestClass.prototype.myMethod);
      expect(metadata).toEqual({ description: 'Test tool', name: 'custom_name' });
    });
  });

  describe('@McpToolGroup', () => {
    it('sets prefix metadata on class', () => {
      @McpToolGroup('features')
      class TestClass {}

      const metadata = Reflect.getMetadata(MCP_TOOL_GROUP_METADATA, TestClass);
      expect(metadata).toBe('features');
    });

    it('sets true when no prefix', () => {
      @McpToolGroup()
      class TestClass {}

      const metadata = Reflect.getMetadata(MCP_TOOL_GROUP_METADATA, TestClass);
      expect(metadata).toBe(true);
    });
  });

  describe('@McpResource', () => {
    it('sets resource metadata with uri', () => {
      class TestClass {
        @McpResource({ uri: 'users://list', name: 'users' })
        listUsers() {}
      }

      const metadata = Reflect.getMetadata(MCP_RESOURCE_METADATA, TestClass.prototype.listUsers);
      expect(metadata).toEqual({ uri: 'users://list', name: 'users' });
    });

    it('sets resource metadata with uriTemplate', () => {
      class TestClass {
        @McpResource({ uriTemplate: 'users://{id}', name: 'user_detail' })
        getUser() {}
      }

      const metadata = Reflect.getMetadata(MCP_RESOURCE_METADATA, TestClass.prototype.getUser);
      expect(metadata.uriTemplate).toBe('users://{id}');
    });
  });

  describe('@McpPrompt', () => {
    it('sets prompt metadata', () => {
      class TestClass {
        @McpPrompt({ name: 'summarize', description: 'Summarize text' })
        summarize() {}
      }

      const metadata = Reflect.getMetadata(MCP_PROMPT_METADATA, TestClass.prototype.summarize);
      expect(metadata).toEqual({ name: 'summarize', description: 'Summarize text' });
    });
  });

  describe('@McpGuard', () => {
    it('sets guard metadata', () => {
      class TestGuard {
        canActivate() { return true; }
      }

      // Apply decorator programmatically to avoid TS syntax issue with overloaded decorator type
      class TestClass {
        myMethod() {}
      }
      (McpGuard as any)(TestGuard)(TestClass.prototype, 'myMethod', Object.getOwnPropertyDescriptor(TestClass.prototype, 'myMethod')!);

      const metadata = Reflect.getMetadata(MCP_GUARD_METADATA, TestClass.prototype.myMethod);
      expect(metadata).toEqual([TestGuard]);
    });
  });
});
