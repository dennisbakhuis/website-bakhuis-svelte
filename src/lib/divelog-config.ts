/**
 * This site's dive log configuration: the one place to change where the log,
 * the editor, the API and the media live.
 */
import { DEFAULT_CONFIG, createUrls, type DivelogConfig } from '$lib/dive/config';

export const divelogConfig: DivelogConfig = DEFAULT_CONFIG;

export const urls = createUrls(divelogConfig);
