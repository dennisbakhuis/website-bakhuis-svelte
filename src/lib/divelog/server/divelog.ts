/**
 * One `Divelog` binds the config, its URL builder and the backend client;
 * every server helper of the kit takes it.
 */
import { createUrls, type DivelogConfig, type DivelogUrls } from '$lib/dive/config';
import { createApi, type Api, type BackendUrl } from './api';

export type Divelog = Api & {
  config: DivelogConfig;
  urls: DivelogUrls;
};

/** Bind a dive log config to a backend. */
export function createDivelog({
  backendUrl,
  config,
}: {
  backendUrl: BackendUrl;
  config: DivelogConfig;
}): Divelog {
  return { ...createApi({ backendUrl }), config, urls: createUrls(config) };
}
