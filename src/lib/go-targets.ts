import { site } from '$lib/site';

/**
 * Outbound destinations reachable through /go/[target].
 *
 * Social links point at `/go/<target>?from=<placement>` so the click is
 * counted server-side (survives ad-blockers) before the 302. Contact goes
 * through the form only: the site shows no e-mail address anywhere.
 */
export const GO_TARGETS = {
  linkedin: { href: site.social.linkedin, event: 'linkedin_click' },
  github: { href: site.social.github, event: 'github_click' },
  medium: { href: site.social.medium, event: 'medium_click' },
} as const;

export type GoTarget = keyof typeof GO_TARGETS;

export function isGoTarget(value: string): value is GoTarget {
  return Object.hasOwn(GO_TARGETS, value);
}

export function goHref(target: GoTarget, from: string): string {
  return `/go/${target}?from=${from}`;
}
