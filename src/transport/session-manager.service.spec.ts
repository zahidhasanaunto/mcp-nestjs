import { SessionManagerService } from './session-manager.service';

describe('SessionManagerService', () => {
  let manager: SessionManagerService;

  beforeEach(() => {
    manager = new SessionManagerService();
    manager.configure({ cleanupInterval: 60000 }); // long interval to avoid interference
  });

  afterEach(() => {
    manager.onModuleDestroy();
  });

  it('creates a session', () => {
    const session = manager.createSession();
    expect(session.id).toBeDefined();
    expect(session.id.length).toBe(32);
    expect(manager.getSessionCount()).toBe(1);
  });

  it('retrieves a session by id', () => {
    const session = manager.createSession();
    const retrieved = manager.getSession(session.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(session.id);
  });

  it('returns undefined for unknown session', () => {
    expect(manager.getSession('nonexistent')).toBeUndefined();
  });

  it('deletes a session', () => {
    const session = manager.createSession();
    expect(manager.deleteSession(session.id)).toBe(true);
    expect(manager.getSession(session.id)).toBeUndefined();
    expect(manager.getSessionCount()).toBe(0);
  });

  it('updates lastActivity on access', () => {
    const session = manager.createSession();
    const initialActivity = session.lastActivity;

    // Small delay to ensure timestamp differs
    const retrieved = manager.getSession(session.id);
    expect(retrieved!.lastActivity).toBeGreaterThanOrEqual(initialActivity);
  });

  it('evicts oldest session when max reached', () => {
    manager.onModuleDestroy();
    manager.configure({ maxSessions: 2, cleanupInterval: 60000 });

    const s1 = manager.createSession();
    const s2 = manager.createSession();
    const s3 = manager.createSession();

    // s1 should have been evicted
    expect(manager.getSession(s1.id)).toBeUndefined();
    expect(manager.getSession(s2.id)).toBeDefined();
    expect(manager.getSession(s3.id)).toBeDefined();
    expect(manager.getSessionCount()).toBe(2);
  });
});
