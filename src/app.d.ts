declare global {
  namespace App {
    interface Locals {
      /** Signed-in owner e-mail, set by hooks.server.ts for /admin requests. */
      owner: string | null;
    }
  }

  interface Window {
    CAP_CUSTOM_WASM_URL: string;
  }
}

declare module '*.md' {
  import type { Component } from 'svelte';
  export default Component;
  export const metadata: Record<string, unknown>;
}

export {};
