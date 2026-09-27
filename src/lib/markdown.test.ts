import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('renders paragraphs, emphasis, links and code', () => {
    const html = renderMarkdown(
      'Hello **world** and *you*.\nSame paragraph [link](https://x.y) `code`.\n\nNext.',
    );
    expect(html).toBe(
      '<p>Hello <strong>world</strong> and <em>you</em>. Same paragraph <a href="https://x.y" rel="noopener">link</a> <code>code</code>.</p>\n<p>Next.</p>',
    );
  });

  it('renders headings, lists, quotes and fences', () => {
    const html = renderMarkdown('# Title\n- a\n- b\n\n1. one\n\n> quoted\n\n```\nx < y\n```');
    expect(html).toContain('<h2>Title</h2>');
    expect(html).toContain('<ul>\n<li>a</li>\n<li>b</li>\n</ul>');
    expect(html).toContain('<ol>\n<li>one</li>\n</ol>');
    expect(html).toContain('<blockquote>quoted</blockquote>');
    expect(html).toContain('<pre><code>\nx &lt; y\n</code></pre>');
  });

  it('never lets raw html through', () => {
    const html = renderMarkdown('<script>alert(1)</script> [x](javascript:alert(1))');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('href="javascript');
  });
});
