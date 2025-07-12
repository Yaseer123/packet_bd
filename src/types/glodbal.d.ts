export {};

declare global {
  interface Window {
    gtag: (
      type: string,
      id: string,
      params?: Record<string, string | number>,
    ) => void;
    fbq: (
      eventName: string,
      eventType: string,
      parameters?: Record<string, string | number>,
    ) => void;
  }
}

declare type JsonValue =
  | string
  | number
  | boolean
  | { [x: string]: JsonValue }
  | Array<JsonValue>
  | null;
