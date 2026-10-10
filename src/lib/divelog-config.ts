/**
 * This site's dive log configuration: the one place to change where the log,
 * the editor, the API and the media live, and the log's personal copy. The
 * kit's defaults are neutral, so everything that makes it this site's log is
 * set here.
 */
import { DEFAULT_CONFIG, createUrls, type DivelogConfig } from '@divelog/kit/core';

export const divelogConfig: DivelogConfig = {
  ...DEFAULT_CONFIG,
  siteName: 'dennisbakhuis.nl',
  ownerName: 'Dennis',
  siteUrl: 'https://dennisbakhuis.nl',
  titleSuffix: 'Dennis Bakhuis',
  copy: {
    logLede:
      'Cold Dutch quarries, French caves on a scooter, Red Sea wrecks. Logged since the first open-water dive — the boring ones too, because the numbers are only honest that way.',
    sitesLede:
      'Every site in the log, grouped by country and region. Each has its own page with the story of the place, a locator map, the dives I did there and, where I have drawn one, a map of the site.',
    peopleLede:
      'Nobody dives alone. Everyone here has been on the other end of a buddy check at least once; first names only, unless someone prefers a nickname.',
    gearTitle: 'What I dive with',
    gearLede:
      'Setups are the combinations I actually dive; items are the pieces. Each shows how many logged dives it has been on.',
  },
};

export const urls = createUrls(divelogConfig);

/** The home page's dive tile. */
export const diveTile = {
  title: 'Diving',
  blurb:
    'Cold Dutch water, French caves, a scooter when the line is long enough. Every dive is logged — the boring ones too.',
};
