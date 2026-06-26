import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter } from "events";
import { IEventBus } from "./event-bus.interface";

@Injectable()
export class EventBusService implements IEventBus {
  private readonly emitter = new EventEmitter();
  private readonly logger = new Logger(EventBusService.name);

  constructor() {
    this.emitter.setMaxListeners(20);
  }

  publish(event: string, payload: unknown): void {
    this.logger.log(`Publishing event: ${event}`);
    this.emitter.emit(event, payload);
  }

  subscribe(
    event: string,
    handler: (payload: unknown) => void | Promise<void>,
  ): void {
    this.logger.log(`Subscribing to event: ${event}`);

    this.emitter.on(event, async (payload: unknown) => {
      const isCritical =
        event === "ASSESSMENT_SUBMITTED" || event === "EVALUATION_COMPLETED";
      const maxAttempts = isCritical ? 3 : 1;
      let attempt = 0;
      let delay = 100; // ms

      while (attempt < maxAttempts) {
        try {
          attempt++;
          await handler(payload);
          return; // Success
        } catch (error: unknown) {
          const errMsg = error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Error in subscriber handler for event "${event}" (attempt ${attempt}/${maxAttempts}): ${errMsg}`,
          );

          if (attempt >= maxAttempts) {
            this.logger.error(
              `Critical failure: Event subscriber for "${event}" failed after ${maxAttempts} attempts.`,
            );
          } else {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
          }
        }
      }
    });
  }
}
