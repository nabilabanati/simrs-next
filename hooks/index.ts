// Re-export all hooks for convenient importing
// Usage: import { useAuth, useDebounce } from '@/hooks'

// Generic/Utility Hooks
export * from "./use-auth";
export * from "./use-local-storage";
export * from "./use-debounce";
export * from "./use-fetch";
export * from "./use-pagination";

// Date/Time Hooks
export * from "./use-date-time";          // Returns formatted string
export * from "./use-date-time-raw";      // Returns Date object

// Domain-Specific Hooks
export * from "./use-mobile";
export * from "./use-poli-patients";
export * from "./use-text-to-speech";
export * from "./use-visits";
