import { describe, expect, it, vi } from 'vitest';

vi.mock('cap-widget', () => ({}));

import { loadCapWidget } from './cap-widget-loader';

describe('loadCapWidget', () => {
  it('points the widget at the self-hosted wasm bundle', async () => {
    await loadCapWidget();
    expect(window.CAP_CUSTOM_WASM_URL).toBe('/cap_wasm_bg.wasm');
  });
});
