import { MonitoringSseController } from "./monitoring-sse.controller";
import { EventEmitter } from "events";

const mockEmitter = new EventEmitter();
(mockEmitter as any).subscribe = jest.fn((channel, cb) => {
  if (cb) cb(null);
});
(mockEmitter as any).unsubscribe = jest.fn().mockResolvedValue(1);
(mockEmitter as any).quit = jest.fn().mockResolvedValue("OK");

jest.mock("ioredis", () => {
  const MockRedis = jest.fn().mockImplementation(() => mockEmitter);
  return {
    __esModule: true,
    default: MockRedis,
    Redis: MockRedis,
  };
});

describe("MonitoringSseController", () => {
  let controller: MonitoringSseController;

  beforeEach(() => {
    controller = new MonitoringSseController();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should stream real-time events over observable with data payload and clean up on close", (done) => {
    const mockReq = new EventEmitter();
    const assessmentId = "test-assessment-realtime-1";

    const observable$ = controller.streamAssessmentEvents(assessmentId, mockReq);
    expect(observable$).toBeDefined();

    const sub = observable$.subscribe({
      next: (msg) => {
        expect(msg).toBeDefined();
        expect(msg.data).toEqual({ type: "TEST_EVENT", payload: { count: 1 } });
        sub.unsubscribe();
        mockReq.emit("close");
        expect((mockEmitter as any).unsubscribe).toHaveBeenCalled();
        done();
      },
    });

    // Simulate Redis message
    mockEmitter.emit("message", `assessment:${assessmentId}:events`, JSON.stringify({
      type: "TEST_EVENT",
      payload: { count: 1 },
    }));
  });
});
