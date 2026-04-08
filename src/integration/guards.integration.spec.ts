import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { McpModule } from '../mcp.module';
import { McpTool } from '../decorators/mcp-tool.decorator';
import { McpGuard } from '../decorators/mcp-guard.decorator';
import { ToolRegistryService } from '../registry/tool-registry.service';
import { McpExecutionContext, McpGuard as IMcpGuard } from '../interfaces/guard.interfaces';

// ─── Guards ────��──────────────────────────────────────────────────

class AllowGuard implements IMcpGuard {
  canActivate(_context: McpExecutionContext): boolean {
    return true;
  }
}

class DenyGuard implements IMcpGuard {
  canActivate(_context: McpExecutionContext): boolean {
    return false;
  }
}

class AsyncAllowGuard implements IMcpGuard {
  async canActivate(_context: McpExecutionContext): Promise<boolean> {
    return true;
  }
}

class SessionRequiredGuard implements IMcpGuard {
  canActivate(context: McpExecutionContext): boolean {
    return !!context.getSessionId();
  }
}

// ─── Services ────��────────────────────────────────────────────────

@Injectable()
@McpGuard(AllowGuard)
class ClassGuardedService {
  @McpTool({ description: 'Allowed by class guard' })
  async allowedTool() {
    return 'allowed';
  }
}

@Injectable()
@McpGuard(DenyGuard)
class ClassDeniedService {
  @McpTool({ description: 'Denied by class guard' })
  async deniedTool() {
    return 'should-not-reach';
  }
}

@Injectable()
class MethodGuardedService {
  @McpTool({ description: 'Method with allow guard' })
  @McpGuard(AllowGuard)
  async methodAllowed() {
    return 'method-allowed';
  }

  @McpTool({ description: 'Method with deny guard' })
  @McpGuard(DenyGuard)
  async methodDenied() {
    return 'should-not-reach';
  }

  @McpTool({ description: 'No guard on this method' })
  async noGuard() {
    return 'no-guard';
  }
}

@Injectable()
class SessionGuardedService {
  @McpTool({ description: 'Requires session' })
  @McpGuard(SessionRequiredGuard)
  async requiresSession() {
    return 'has-session';
  }
}

@Injectable()
@McpGuard(AllowGuard)
class MixedGuardService {
  @McpTool({ description: 'Class allow + method deny' })
  @McpGuard(DenyGuard)
  async classPlusMethodGuard() {
    return 'should-not-reach';
  }

  @McpTool({ description: 'Only class allow guard' })
  async onlyClassGuard() {
    return 'class-only';
  }
}

@Injectable()
class AsyncGuardedService {
  @McpTool({ description: 'Async guard' })
  @McpGuard(AsyncAllowGuard)
  async asyncGuarded() {
    return 'async-allowed';
  }
}

// ─── Unguarded service for global guard tests ─────────────────────

@Injectable()
class UnguardedService {
  @McpTool({ description: 'Unguarded tool' })
  async open() {
    return 'open';
  }
}

// ─── Test Suites ──────────────────────────────────────────────────

describe('Guard Integration — Per-tool and Per-class Guards', () => {
  let module: TestingModule;
  let registry: ToolRegistryService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        McpModule.forRoot({
          name: 'guard-test',
          version: '1.0.0',
        }),
      ],
      providers: [
        ClassGuardedService,
        ClassDeniedService,
        MethodGuardedService,
        SessionGuardedService,
        MixedGuardService,
        AsyncGuardedService,
      ],
    }).compile();

    await module.init();
    registry = module.get(ToolRegistryService);
  });

  afterAll(async () => {
    await module?.close();
  });

  it('allows execution when class guard returns true', async () => {
    const result = await registry.executeTool('allowedTool', {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe('allowed');
  });

  it('denies execution when class guard returns false', async () => {
    const result = await registry.executeTool('deniedTool', {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Access denied');
    expect(result.content[0].text).toContain('DenyGuard');
  });

  it('allows execution when method guard returns true', async () => {
    const result = await registry.executeTool('methodAllowed', {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe('method-allowed');
  });

  it('denies execution when method guard returns false', async () => {
    const result = await registry.executeTool('methodDenied', {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Access denied');
  });

  it('allows execution when no guard is set', async () => {
    const result = await registry.executeTool('noGuard', {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe('no-guard');
  });

  it('runs class guard then method guard — deny wins', async () => {
    const result = await registry.executeTool('classPlusMethodGuard', {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Access denied');
  });

  it('only class guard when no method guard', async () => {
    const result = await registry.executeTool('onlyClassGuard', {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe('class-only');
  });

  it('supports async guards', async () => {
    const result = await registry.executeTool('asyncGuarded', {});
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe('async-allowed');
  });

  it('session guard denies when no session', async () => {
    const result = await registry.executeTool('requiresSession', {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Access denied');
  });

  it('session guard allows when session provided', async () => {
    const result = await registry.executeTool('requiresSession', {}, 'test-session-123');
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe('has-session');
  });
});

describe('Guard Integration — Global Guards', () => {
  let module: TestingModule;
  let registry: ToolRegistryService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        McpModule.forRoot({
          name: 'global-guard-test',
          version: '1.0.0',
          guards: [DenyGuard],
        }),
      ],
      providers: [UnguardedService],
    }).compile();

    await module.init();
    registry = module.get(ToolRegistryService);
  });

  afterAll(async () => {
    await module?.close();
  });

  it('applies global guard to all tools', async () => {
    const result = await registry.executeTool('open', {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Access denied');
    expect(result.content[0].text).toContain('DenyGuard');
  });
});

describe('Guard Integration — Global Allow + Per-tool Deny', () => {
  let module: TestingModule;
  let registry: ToolRegistryService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        McpModule.forRoot({
          name: 'mixed-guard-test',
          version: '1.0.0',
          guards: [AllowGuard],
        }),
      ],
      providers: [MethodGuardedService],
    }).compile();

    await module.init();
    registry = module.get(ToolRegistryService);
  });

  afterAll(async () => {
    await module?.close();
  });

  it('global allow + method deny = denied', async () => {
    const result = await registry.executeTool('methodDenied', {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Access denied');
  });

  it('global allow + method allow = allowed', async () => {
    const result = await registry.executeTool('methodAllowed', {});
    expect(result.isError).toBeFalsy();
  });

  it('global allow + no method guard = allowed', async () => {
    const result = await registry.executeTool('noGuard', {});
    expect(result.isError).toBeFalsy();
  });
});
