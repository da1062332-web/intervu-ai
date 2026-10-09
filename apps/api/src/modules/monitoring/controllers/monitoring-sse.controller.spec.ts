import { Subject } from "rxjs";
import { MonitoringSseController } from "./monitoring-sse.controller";
import {
  AssessmentChannelMessage,
  MonitoringEventBusService,
} from "../services/monitoring-event-bus.service";

describe("MonitoringSseController", () => {
  let controller: MonitoringSseController;
  let feed$: Subject<AssessmentChannelMessage>;

  beforeEach(() => {
    feed$ = new Subject<AssessmentChannelMessage>();
    const eventBus = { stream: () => feed$.asObservable() } as unknown as MonitoringEventBusService;
    controller = new MonitoringSseController(eventBus);
  });

  it("should stream events for its own assessment channel only", (done) => {
    const assessmentId = "test-assessment-realtime-1";

    const sub = controller.streamAssessmentEvents(assessmentId).subscribe({
      next: (msg) => {
        if ((msg.data as any)?.type === "PING") return;
        expect(msg.data).toEqual({ type: "TEST_EVENT", payload: { count: 1 } });
        sub.unsubscribe();
        done();
      },
    });

    // Another assessment's event must be filtered out
    feed$.next({
      channel: "assessment:other-assessment:events",
      message: JSON.stringify({ type: "OTHER_EVENT" }),
    });
    feed$.next({
      channel: `assessment:${assessmentId}:events`,
      message: JSON.stringify({ type: "TEST_EVENT", payload: { count: 1 } }),
    });
  });

  it("should forward every assessment channel for the 'all' stream", (done) => {
    const sub = controller.streamAssessmentEvents("all").subscribe({
      next: (msg) => {
        if ((msg.data as any)?.type === "PING") return;
        expect(msg.type).toBe("OTHER_EVENT");
        sub.unsubscribe();
        done();
      },
    });

    feed$.next({
      channel: "assessment:other-assessment:events",
      message: JSON.stringify({ type: "OTHER_EVENT" }),
    });
  });
});
