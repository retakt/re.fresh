import * as Sentry from "@sentry/react";

let initialized = false;

function parseSampleRate(value: string | undefined) {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 0.2;
  }

  return Math.min(Math.max(parsed, 0), 1);
}

export function initMonitoring() {
  if (initialized) {
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    tracesSampleRate: parseSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE),
    release: __APP_VERSION__,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    enabled: true,
    sendDefaultPii: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
  });

  initialized = true;
}

export { Sentry };
