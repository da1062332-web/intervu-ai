type EventType =
  | 'QUESTION_VIEWED'
  | 'ANSWER_SAVED'
  | 'ANSWER_CLEARED'
  | 'SECTION_CHANGED'
  | 'MARKED_FOR_REVIEW'
  | 'SUBMIT_CLICKED'
  | 'TAB_HIDDEN'
  | 'TAB_VISIBLE';

export interface TestEvent {
  id: string;
  type: EventType;
  timestamp: string;
  payload?: any;
}

class TestEventTracker {
  private events: TestEvent[] = [];
  private readonly STORAGE_KEY = 'intervu_test_events';

  constructor() {
    this.loadEvents();
  }

  private loadEvents() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.events = JSON.parse(stored);
        }
      }
    } catch (e) {
      console.error('Failed to load events', e);
    }
  }

  private saveEvents() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
      }
    } catch (e) {
      console.error('Failed to save events', e);
    }
  }

  public track(type: EventType, payload?: any) {
    const event: TestEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      payload,
    };

    this.events.push(event);
    this.saveEvents();
  }

  public getEvents(): TestEvent[] {
    return this.events;
  }

  public clearEvents() {
    this.events = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

export const eventTracker = new TestEventTracker();
