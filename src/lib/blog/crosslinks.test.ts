import { describe, expect, it } from 'vitest';
import { compile } from 'mdsvex';
import { prettifySlug, remarkCrosslinks, resolveShortcode, splitShortcodes } from './crosslinks';

async function render(source: string): Promise<string> {
  const result = await compile(source, { remarkPlugins: [remarkCrosslinks] });
  return result?.code ?? '';
}

describe('crosslinks', () => {
  it('prettifies site slugs', () => {
    expect(prettifySlug('mex-mayan-blue')).toBe('Mex Mayan Blue');
    expect(prettifySlug('zeelandbrug')).toBe('Zeelandbrug');
  });

  it('resolves dives and sites', () => {
    expect(resolveShortcode('dive', '409', undefined)).toEqual({
      href: '/dive/409',
      text: 'dive #409',
    });
    expect(resolveShortcode('dive', '0409', ' the cold one ')).toEqual({
      href: '/dive/409',
      text: 'the cold one',
    });
    expect(resolveShortcode('dive', 'abc', undefined)).toBeNull();
    expect(resolveShortcode('site', 'Mex-Mayan-Blue', undefined)).toEqual({
      href: '/dive/sites/mex-mayan-blue',
      text: 'Mex Mayan Blue',
    });
  });

  it('splits text into text and link nodes', () => {
    const nodes = splitShortcodes('a [[dive:1]] b [[dive:x]] [[site:foo|Foo]]');
    expect(nodes.map((n) => n.type)).toEqual(['text', 'link', 'text', 'link']);
    expect(nodes[1]).toMatchObject({ url: '/dive/1', children: [{ value: 'dive #1' }] });
    expect(nodes[2].value).toBe(' b [[dive:x]] ');
    expect(nodes[3]).toMatchObject({ url: '/dive/sites/foo', children: [{ value: 'Foo' }] });
    expect(splitShortcodes('plain')).toEqual([{ type: 'text', value: 'plain' }]);
  });

  it('rewrites shortcodes in compiled markdown', async () => {
    const html = await render(
      'See [[dive:409]], [[site:mex-mayan-blue]] and [[dive:12|my first]].',
    );
    expect(html).toContain('<a href="/dive/409">dive #409</a>');
    expect(html).toContain('<a href="/dive/sites/mex-mayan-blue">Mex Mayan Blue</a>');
    expect(html).toContain('<a href="/dive/12">my first</a>');
    expect(html).not.toContain('[[');
  });

  it('leaves code, ordinary links and unknown kinds alone', async () => {
    const html = await render(
      'Code `[[dive:1]]`, a [link](/x), [[gear:fins]] and [[dive:1]] in **bold [[site:a-b]]**.',
    );
    expect(html).toContain('<code>[[dive:1]]</code>');
    expect(html).toContain('<a href="/x">link</a>');
    expect(html).toContain('[[gear:fins]]');
    expect(html).toContain('<a href="/dive/1">dive #1</a>');
    expect(html).toContain('<strong>bold <a href="/dive/sites/a-b">A B</a></strong>');
  });
});
