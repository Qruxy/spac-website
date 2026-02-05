'use client';

/**
 * Breadcrumbs Component
 *
 * Animated breadcrumb navigation for subpages.
 * Auto-generates from pathname or accepts custom items.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  /** Custom breadcrumb items (overrides auto-generation) */
  items?: BreadcrumbItem[];
  /** Custom label overrides for path segments */
  labels?: Record<string, string>;
  /** Show home icon */
  showHome?: boolean;
  /** Additional className */
  className?: string;
  /** Separator variant */
  separator?: 'chevron' | 'slash' | 'dot';
}

// Default label mappings for common paths
const defaultLabels: Record<string, string> = {
  about: 'About',
  events: 'Events',
  gallery: 'Gallery',
  classifieds: 'Classifieds',
  vsa: 'VSA',
  donations: 'Donations',
  newsletter: 'Newsletter',
  obs: 'OBS Star Party',
  'mirror-lab': 'Mirror Lab',
  history: 'History',
  dashboard: 'Dashboard',
  profile: 'Profile',
  settings: 'Settings',
  admin: 'Admin',
  'my-listings': 'My Listings',
  'my-photos': 'My Photos',
  'my-events': 'My Events',
  'my-offers': 'My Offers',
  billing: 'Billing',
  'membership-card': 'Membership Card',
  login: 'Sign In',
  register: 'Join SPAC',
  'thank-you': 'Thank You',
};

function formatSegment(segment: string, labels?: Record<string, string>): string {
  // Check custom labels first, then defaults
  if (labels?.[segment]) return labels[segment];
  if (defaultLabels[segment]) return defaultLabels[segment];
  
  // Format as title case
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const separatorVariants = {
  chevron: <ChevronRight className="h-4 w-4 text-muted-foreground/50" />,
  slash: <span className="text-muted-foreground/50">/</span>,
  dot: <span className="text-muted-foreground/50">•</span>,
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
};

export function Breadcrumbs({
  items: customItems,
  labels,
  showHome = true,
  className,
  separator = 'chevron',
}: BreadcrumbsProps) {
  const pathname = usePathname();

  const items = useMemo(() => {
    if (customItems) return customItems;

    // Generate from pathname
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    let currentPath = '';

    for (const segment of segments) {
      // Skip route groups (in parentheses)
      if (segment.startsWith('(') && segment.endsWith(')')) continue;
      
      // Skip dynamic segments that look like UUIDs
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
        continue;
      }

      currentPath += `/${segment}`;
      breadcrumbs.push({
        label: formatSegment(segment, labels),
        href: currentPath,
      });
    }

    return breadcrumbs;
  }, [customItems, pathname, labels]);

  // Don't render on home page
  if (pathname === '/' || items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1.5 text-sm', className)}
    >
      <ol className="flex items-center gap-1.5 flex-wrap">
        {/* Home link */}
        {showHome && (
          <motion.li
            custom={0}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center"
          >
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1 rounded-md hover:bg-muted"
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
            <span className="ml-2">{separatorVariants[separator]}</span>
          </motion.li>
        )}

        {/* Breadcrumb items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <motion.li
              key={item.href}
              custom={showHome ? index + 1 : index}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center"
            >
              {isLast ? (
                <span
                  className="font-medium text-foreground px-1"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <>
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 rounded-md hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                  <span className="ml-2">{separatorVariants[separator]}</span>
                </>
              )}
            </motion.li>
          );
        })}
      </ol>
    </nav>
  );
}

// Structured data for SEO
export function BreadcrumbsJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: `https://stpeteastronomyclub.org${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default Breadcrumbs;
