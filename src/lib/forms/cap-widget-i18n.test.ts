import { describe, expect, it } from 'vitest';
import { capWidgetI18nProps } from './cap-widget-i18n';

describe('capWidgetI18nProps', () => {
  it('labels every state of the widget in English', () => {
    const props = capWidgetI18nProps();
    expect(Object.keys(props).every((k) => k.startsWith('data-cap-i18n-'))).toBe(true);
    expect(props['data-cap-i18n-initial-state']).toBe("I'm human");
    expect(props['data-cap-i18n-group-aria-label']).toBe('Cap verification');
    expect(Object.values(props).every((v) => v.length > 0)).toBe(true);
  });
});
