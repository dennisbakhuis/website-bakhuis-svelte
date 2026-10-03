declare global {
  namespace App {
    interface Locals {
      /** Signed-in owner e-mail, resolved by hooks.server.ts on every request. */
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
