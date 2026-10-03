// Remark plugin for mdsvex: `[[dive:409]]`, `[[site:mex-mayan-blue]]` and
// `[[dive:409|custom text]]` become links into the dive log. Runs at build
// time only.
//
// remark-parse (the version mdsvex bundles) reads `[[dive:409]]` as a shortcut
// linkReference wrapped in literal brackets, so the plugin first folds those
// references back into plain text and then rewrites the text.

const SHORTCODE = /\[\[(dive|site):([a-z0-9-]+)(?:\|([^\]\n]+))?\]\]/gi;
const LABEL = /^(dive|site):[a-z0-9-]+(\|[^\]\n]+)?$/i;

/**
 * @typedef {{ type: string; value?: string; url?: string; title?: string | null;
 *   label?: string; referenceType?: string; children?: MdNode[] }} MdNode
 */

/**
 * Turn a site slug into a readable name: `mex-mayan-blue` → `Mex Mayan Blue`.
 * @param {string} slug
 * @returns {string}
 */
export function prettifySlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Resolve one shortcode to its href and link text, or null when malformed.
 * @param {string} kind
 * @param {string} ref
 * @param {string | undefined} text
 * @returns {{ href: string; text: string } | null}
 */
export function resolveShortcode(kind, ref, text) {
  const custom = text?.trim();
  if (kind.toLowerCase() === 'dive') {
    if (!/^\d+$/.test(ref)) return null;
    const number = String(Number(ref));
    return { href: `/dive/${number}`, text: custom || `dive #${number}` };
  }
  const slug = ref.toLowerCase();
  return { href: `/dive/sites/${slug}`, text: custom || prettifySlug(slug) };
}

/**
 * Split a string into text and link nodes.
 * @param {string} value
 * @returns {MdNode[]}
 */
export function splitShortcodes(value) {
  /** @type {MdNode[]} */
  const out = [];
  let last = 0;
  for (const match of value.matchAll(SHORTCODE)) {
    const resolved = resolveShortcode(match[1], match[2], match[3]);
    if (!resolved) continue;
    const start = match.index ?? 0;
    if (start > last) out.push({ type: 'text', value: value.slice(last, start) });
    out.push({
      type: 'link',
      url: resolved.href,
      title: null,
      children: [{ type: 'text', value: resolved.text }],
    });
    last = start + match[0].length;
  }
  if (last < value.length) out.push({ type: 'text', value: value.slice(last) });
  return out;
}

/**
 * @param {MdNode} node
 * @returns {boolean}
 */
function isShortcodeReference(node) {
  return (
    node.type === 'linkReference' &&
    node.referenceType === 'shortcut' &&
    typeof node.label === 'string' &&
    LABEL.test(node.label)
  );
}

/**
 * @param {MdNode[]} children
 * @returns {MdNode[]}
 */
function rewrite(children) {
  /** @type {MdNode[]} */
  const merged = [];
  for (const child of children) {
    const node = isShortcodeReference(child)
      ? { type: 'text', value: `[${child.label ?? ''}]` }
      : child;
    const prev = merged[merged.length - 1];
    if (node.type === 'text' && prev?.type === 'text') {
      prev.value = `${prev.value ?? ''}${node.value ?? ''}`;
    } else {
      merged.push(node.type === 'text' ? { ...node } : node);
    }
  }
  return merged.flatMap((node) =>
    node.type === 'text' && node.value?.includes('[[') ? splitShortcodes(node.value) : [node],
  );
}

/**
 * @param {MdNode} node
 */
function walk(node) {
  if (!node.children || node.type === 'link' || node.type === 'linkReference') return;
  node.children = rewrite(node.children);
  for (const child of node.children) walk(child);
}

/** Remark plugin factory for mdsvex's `remarkPlugins`. */
export function remarkCrosslinks() {
  /** @param {MdNode} tree */
  return (tree) => {
    walk(tree);
  };
}
