export interface IEventBus {
  publish(event: string, payload: unknown): void;
  subscribe(event: string, handler: (payload: unknown) => void | Promise<void>): void;
}
