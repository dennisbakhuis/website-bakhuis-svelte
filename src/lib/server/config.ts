export const PRODUCTION_HOSTNAMES = ['dennisbakhuis.nl', 'www.dennisbakhuis.nl'] as const;

export function isProductionHostname(hostname: string): boolean {
  return (PRODUCTION_HOSTNAMES as readonly string[]).includes(hostname);
}
