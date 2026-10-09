/**
 * Rasterise the OG card SVGs with resvg. resvg reads fonts from disk only
 * (TTF/OTF, no WOFF2), so the three bundled TTFs are inlined into the server
 * build and written to a temp directory once per process. Inlining keeps the
 * bundled server self-contained: a `new URL('./fonts/…', import.meta.url)`
 * is not rewritten in the SSR build and would point next to the output chunk.
 */
import { Resvg } from '@resvg/resvg-js';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import groteskBold from './fonts/SpaceGrotesk-Bold.ttf?inline';
import groteskMedium from './fonts/SpaceGrotesk-Medium.ttf?inline';
import monoRegular from './fonts/JetBrainsMono-Regular.ttf?inline';
import { FONT_DISPLAY, FONT_MONO } from './card';

const FONTS: Record<string, string> = {
  'SpaceGrotesk-Bold.ttf': groteskBold,
  'SpaceGrotesk-Medium.ttf': groteskMedium,
  'JetBrainsMono-Regular.ttf': monoRegular,
};

let fontFiles: Promise<string[]> | null = null;

function decodeDataUrl(url: string): Buffer {
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
}

async function writeFonts(): Promise<string[]> {
  const dir = await mkdtemp(join(tmpdir(), 'og-fonts-'));
  return Promise.all(
    Object.entries(FONTS).map(async ([name, url]) => {
      const path = join(dir, name);
      await writeFile(path, decodeDataUrl(url));
      return path;
    }),
  );
}

function fonts(): Promise<string[]> {
  fontFiles ??= writeFonts().catch((err: unknown) => {
    fontFiles = null;
    throw err;
  });
  return fontFiles;
}

export async function renderPng(svg: string): Promise<Uint8Array> {
  const resvg = new Resvg(svg, {
    font: {
      fontFiles: await fonts(),
      loadSystemFonts: false,
      defaultFontFamily: FONT_DISPLAY,
      sansSerifFamily: FONT_DISPLAY,
      monospaceFamily: FONT_MONO,
    },
  });
  return new Uint8Array(resvg.render().asPng());
}

export const OG_CACHE = 'public, max-age=86400';
