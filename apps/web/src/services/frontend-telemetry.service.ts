type TelemetryEvent =
  | 'PAGE_LOAD'
  | 'ROUTE_CHANGE'
  | 'API_FAILURE'
  | 'SUBMISSION_FAILURE'
  | 'RENDERING_ERROR';

interface TelemetryPayload {
  eventName: TelemetryEvent;
  path: string;
  timestamp: number;
  metadata?: Record<string, any>;
  error?: any;
}

class FrontendTelemetryService {
  private static instance: FrontendTelemetryService;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): FrontendTelemetryService {
    if (!FrontendTelemetryService.instance) {
      FrontendTelemetryService.instance = new FrontendTelemetryService();
    }
    return FrontendTelemetryService.instance;
  }

  /**
   * Track an event. MVP implementation logs to console.
   * Future implementation can send to Sentry, Datadog, or PostHog.
   */
  public trackEvent(eventName: TelemetryEvent, metadata?: Record<string, any>, error?: any): void {
    const payload: TelemetryPayload = {
      eventName,
      path: typeof window !== 'undefined' ? window.location.pathname : 'server',
      timestamp: Date.now(),
      metadata,
      error,
    };

    if (process.env.NODE_ENV === 'development') {
      console.group(`[Telemetry] ${eventName}`);
      console.log('Payload:', payload);
      if (error) console.error('Error Details:', error);
      console.groupEnd();
    } else {
      // In production, this would dispatch to the external telemetry service
      // e.g., Sentry.captureException(error, { extra: payload });
      // e.g., datadogLogs.logger.info(eventName, payload);
    }
  }

  public trackPageLoad(path: string): void {
    this.trackEvent('PAGE_LOAD', { path });
  }

  public trackRouteChange(from: string, to: string): void {
    this.trackEvent('ROUTE_CHANGE', { from, to });
  }

  public trackApiFailure(endpoint: string, status: number, error: any): void {
    this.trackEvent('API_FAILURE', { endpoint, status }, error);
  }

  public trackSubmissionFailure(formName: string, error: any): void {
    this.trackEvent('SUBMISSION_FAILURE', { formName }, error);
  }

  public trackRenderingError(componentName: string, error: Error): void {
    this.trackEvent('RENDERING_ERROR', { componentName }, error);
  }
}

export const telemetry = FrontendTelemetryService.getInstance();
