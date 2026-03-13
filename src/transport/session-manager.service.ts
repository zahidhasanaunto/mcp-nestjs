import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { SessionConfig } from '../interfaces/module-options.interfaces';

export interface Session {
  id: string;
  createdAt: number;
  lastActivity: number;
  data: Map<string, any>;
}

@Injectable()
export class SessionManagerService implements OnModuleDestroy {
  private readonly logger = new Logger(SessionManagerService.name);
  private readonly sessions = new Map<string, Session>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  private timeout = 30 * 60 * 1000;       // 30 minutes
  private cleanupInterval = 5 * 60 * 1000; // 5 minutes
  private maxSessions = 1000;

  configure(config?: SessionConfig) {
    if (config?.timeout !== undefined) this.timeout = config.timeout;
    if (config?.cleanupInterval !== undefined) this.cleanupInterval = config.cleanupInterval;
    if (config?.maxSessions !== undefined) this.maxSessions = config.maxSessions;

    this.startCleanup();
  }

  private startCleanup() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  createSession(): Session {
    if (this.sessions.size >= this.maxSessions) {
      // Evict oldest session
      let oldest: Session | null = null;
      for (const session of this.sessions.values()) {
        if (!oldest || session.lastActivity < oldest.lastActivity) {
          oldest = session;
        }
      }
      if (oldest) {
        this.sessions.delete(oldest.id);
        this.logger.warn(`Evicted session ${oldest.id} (max sessions reached)`);
      }
    }

    const session: Session = {
      id: this.generateId(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
      data: new Map(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): Session | undefined {
    const session = this.sessions.get(id);
    if (session) {
      session.lastActivity = Date.now();
    }
    return session;
  }

  deleteSession(id: string): boolean {
    return this.sessions.delete(id);
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  private cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity > this.timeout) {
        this.sessions.delete(id);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired sessions`);
    }
  }

  private generateId(): string {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}
