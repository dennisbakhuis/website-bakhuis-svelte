import { urls } from '$lib/divelog-config';

export const site = {
  name: 'Dennis Bakhuis',
  role: 'Data scientist & engineer',
  tagline: 'Turning turbulent data into things that work.',
  location: 'Enschede, the Netherlands',
  timezone: 'Europe/Amsterdam',
  availability: 'Open to interesting projects',
  email: 'owner@example.org',
  social: {
    linkedin: 'https://linkedin.com/in/dennisbakhuis',
    github: 'https://github.com/dennisbakhuis',
    medium: 'https://medium.com/@dennisbakhuis',
    bluesky: '',
  },
} as const;

export const emailHref = `mailto:${site.email}`;

export const skills = [
  'Python',
  'Machine learning',
  'LLMs & GenAI',
  'Data engineering',
  'MLOps',
  'Rust',
  'Docker',
  'Svelte',
  'Open source',
] as const;

export type WorkItem = {
  title: string;
  description: string;
  tags: string[];
  year: string;
  href?: string;
};

export const work: WorkItem[] = [
  {
    title: 'Grid analytics at TenneT',
    description:
      'ML systems and data pipelines for the Dutch–German high-voltage grid: forecasting, anomaly detection and the plumbing that keeps them honest.',
    tags: ['ML', 'Data engineering'],
    year: '2021 – now',
  },
  {
    title: 'pigeonXT',
    description:
      'A Jupyter widget for fast, keyboard-driven labelling of text and images. Used by data teams that would rather label than build labelling tools.',
    tags: ['Open source', 'Python'],
    year: '2020',
    href: 'https://github.com/dennisbakhuis/pigeonXT',
  },
  {
    title: 'Python 10 Minutes a Day',
    description:
      'A 40-part series on Towards Data Science taking readers from zero to comfortable Python, ten minutes at a time.',
    tags: ['Writing', 'Teaching'],
    year: '2020',
    href: 'https://towardsdatascience.com/tagged/python-10-minutes-a-day',
  },
  {
    title: 'PhD — turbulence',
    description:
      'Experimental fluid dynamics at the University of Twente: bubbles, boundary layers and a lot of laser light. Where the data habit started.',
    tags: ['Physics', 'Research'],
    year: '2011 – 2016',
  },
];

export type Like = {
  id: 'diving' | 'writing' | 'opensource' | 'music' | 'home';
  title: string;
  blurb: string;
  href?: string;
};

export const likes: Like[] = [
  {
    id: 'diving',
    title: 'Diving',
    blurb: 'Cold Dutch water, French caves, a scooter when the line is long enough.',
    href: urls.log(),
  },
  {
    id: 'writing',
    title: 'Writing',
    blurb: 'Long-form on the blog, five-line notes in the TIL.',
    href: '/blog',
  },
  {
    id: 'opensource',
    title: 'Open source',
    blurb: 'Small tools that scratch a real itch.',
    href: 'https://github.com/dennisbakhuis',
  },
  {
    id: 'home',
    title: 'Home automation',
    blurb: 'Home Assistant, a heat pump that reports to Grafana, too many sensors.',
  },
];
