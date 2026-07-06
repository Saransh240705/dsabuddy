// ── SEO Configuration ─────────────────────────────────────────────────────
// Single source of truth for site-wide SEO metadata. Per-page overrides are
// passed to the <Seo /> component (see components/common/Seo.jsx).

export const SITE = {
  name: 'DSABuddy',
  url: 'https://dsabuddy.xyz',
  // <title> shown when a page provides no title of its own
  defaultTitle:
    'DSABuddy — Track Your DSA Practice Across LeetCode, Codeforces, CodeChef & GFG',
  description:
    'DSABuddy is one place to track all your DSA practice. Connect LeetCode, Codeforces, CodeChef, and GeeksforGeeks to see unified stats, streaks, and leaderboards while you prepare for coding interviews.',
  defaultImage: 'https://dsabuddy.xyz/logo.png',
  locale: 'en_US',
  twitter: '@dsabuddy',
  themeColor: '#000000',
};

/** Resolve a path or relative URL to an absolute URL on the canonical domain. */
export function absoluteUrl(path = '/') {
  if (!path) return SITE.url;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE.url}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ── Reusable structured data (JSON-LD) ─────────────────────────────────────

/** Organization schema — describes the DSABuddy brand entity. */
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  url: SITE.url,
  logo: SITE.defaultImage,
  description: SITE.description,
};

/** WebSite schema with a SearchAction (enables the sitelinks search box). */
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  url: SITE.url,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE.url}/leaderboard?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

/** WebApplication schema — describes the product itself. */
export const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE.name,
  url: SITE.url,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  description: SITE.description,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

/** Build a BreadcrumbList schema from an ordered list of { name, path }. */
export function breadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
