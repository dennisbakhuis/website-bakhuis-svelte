// Build-time syntax highlighting for mdsvex code fences via Shiki. Runs only
// during `vite build`/dev compilation, so the theme grammars never ship to the
// browser. Braces and backticks are escaped so Svelte does not parse them.

import { createHighlighter } from 'shiki';

const THEME = 'github-dark-default';

/** @type {Promise<import('shiki').Highlighter> | null} */
let highlighterPromise = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({ themes: [THEME], langs: [] });
  }
  return highlighterPromise;
}

/** @param {string} html */
function escapeSvelte(html) {
  return html
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;')
    .replace(/`/g, '&#96;')
    .replace(/\\/g, '&#92;');
}

/**
 * @param {string} code
 * @param {string | null | undefined} lang
 * @returns {Promise<string>}
 */
export async function highlighter(code, lang) {
  const highlighter = await getHighlighter();
  let language = (lang || 'text').toLowerCase();
  try {
    await highlighter.loadLanguage(/** @type {any} */ (language));
  } catch {
    language = 'text';
    await highlighter.loadLanguage('text');
  }
  const html = highlighter.codeToHtml(code, { lang: language, theme: THEME });
  return `{@html \`${escapeSvelte(html)}\`}`;
}
