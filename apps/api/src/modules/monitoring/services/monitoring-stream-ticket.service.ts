import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { AppLogger } from "@intervu-ai/shared-logger";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";

const TICKET_TTL_SECONDS = 30;
const TICKET_PATTERN = /^[a-f0-9]{64}$/;
const ticketKey = (ticket: string) => `monitoring:sse_ticket:${ticket}`;

/**
 * Short-lived, single-use tickets for opening the live monitoring SSE stream.
 *
 * EventSource cannot send an Authorization header, so the stream used to take the
 * access JWT as `?token=` — which leaked a long-lived admin credential into proxy
 * access logs and browser history. A ticket is useless once redeemed and expires
 * after 30 seconds, so a leaked URL carries no reusable credential.
 */
@Injectable()
export class MonitoringStreamTicketService {
  private readonly logger = new AppLogger({ name: "MonitoringStreamTicketService" });

  // Fallback when Redis is unavailable (only valid for a single API instance)
  private readonly memoryTickets = new Map<string, { user: AuthUser; expiresAt: number }>();

  async issue(user: AuthUser): Promise<{ ticket: string; expiresInSeconds: number }> {
    const ticket = randomBytes(32).toString("hex");
    const payload: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: user.sessionId,
    };

    if (RedisConnectionManager.isConnected()) {
      try {
        await RedisConnectionManager.getInstance().set(
          ticketKey(ticket),
          JSON.stringify(payload),
          "EX",
          TICKET_TTL_SECONDS,
        );
        return { ticket, expiresInSeconds: TICKET_TTL_SECONDS };
      } catch (err) {
        this.logger.warn("Failed storing SSE ticket in Redis; using in-memory fallback", err);
      }
    }

    this.pruneExpired();
    this.memoryTickets.set(ticket, {
      user: payload,
      expiresAt: Date.now() + TICKET_TTL_SECONDS * 1000,
    });
    return { ticket, expiresInSeconds: TICKET_TTL_SECONDS };
  }

  /** Atomically consumes the ticket. Returns null if it is unknown, expired or already used. */
  async redeem(ticket: unknown): Promise<AuthUser | null> {
    if (typeof ticket !== "string" || !TICKET_PATTERN.test(ticket)) return null;

    if (RedisConnectionManager.isConnected()) {
      try {
        const key = ticketKey(ticket);
        const results = await RedisConnectionManager.getInstance()
          .multi()
          .get(key)
          .del(key)
          .exec();
        const raw = results?.[0]?.[1];
        if (typeof raw === "string") {
          return JSON.parse(raw) as AuthUser;
        }
      } catch (err) {
        this.logger.warn("Failed redeeming SSE ticket from Redis", err);
      }
    }

    const entry = this.memoryTickets.get(ticket);
    this.memoryTickets.delete(ticket);
    if (!entry || entry.expiresAt < Date.now()) return null;
    return entry.user;
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [ticket, entry] of this.memoryTickets) {
      if (entry.expiresAt < now) this.memoryTickets.delete(ticket);
    }
  }
}
