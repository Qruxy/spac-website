'use client';

/**
 * Newsletter Client Component
 *
 * Interactive client-side component for browsing newsletters.
 * Features: year filter, search, grid/list toggle.
 */

import { useState, useEffect, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Grid3X3,
  List,
  Calendar,
  FileText,
  Download,
  ExternalLink,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import SpotlightCard from '@/components/SpotlightCard';

interface Newsletter {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  filename: string;
  mimeType: string;
  size: number;
  year: number | null;
  month: number | null;
  monthName: string | null;
  createdAt: string;
}

interface NewsletterClientProps {
  initialNewsletters: Newsletter[];
  initialYears: number[];
  initialTotal: number;
  initialTotalPages: number;
}

export function NewsletterClient({
  initialNewsletters,
  initialYears,
  initialTotal,
  initialTotalPages,
}: NewsletterClientProps) {
  const [newsletters, setNewsletters] = useState(initialNewsletters);
  const [years] = useState(initialYears);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch newsletters when filters change
  const fetchNewsletters = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear !== 'all') params.set('year', selectedYear);
      if (debouncedSearch) params.set('q', debouncedSearch);
      params.set('page', page.toString());

      const response = await fetch(`/api/newsletters?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      startTransition(() => {
        setNewsletters(data.newsletters);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      });
    } catch (error) {
      console.error('Error fetching newsletters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, debouncedSearch]);

  // Refetch when filters change
  useEffect(() => {
    fetchNewsletters(1);
  }, [selectedYear, debouncedSearch, fetchNewsletters]);

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get month color
  const getMonthColor = (month: number | null) => {
    if (!month) return 'from-slate-600 to-slate-700';
    const colors = [
      'from-blue-600 to-indigo-700',      // Jan
      'from-purple-600 to-pink-700',      // Feb
      'from-green-600 to-teal-700',       // Mar
      'from-cyan-600 to-blue-700',        // Apr
      'from-pink-600 to-rose-700',        // May
      'from-yellow-600 to-orange-700',    // Jun
      'from-red-600 to-orange-700',       // Jul
      'from-amber-600 to-yellow-700',     // Aug
      'from-orange-600 to-red-700',       // Sep
      'from-indigo-600 to-purple-700',    // Oct
      'from-rose-600 to-pink-700',        // Nov
      'from-teal-600 to-cyan-700',        // Dec
    ];
    return colors[month - 1] || colors[0];
  };

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search newsletters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Year Filter */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              <option value="all">All Years</option>
              {years.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-card">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? 'newsletter' : 'newsletters'}
          {selectedYear !== 'all' && ` from ${selectedYear}`}
          {debouncedSearch && ` matching "${debouncedSearch}"`}
        </p>
        {(isLoading || isPending) && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
      </div>

      {/* Newsletter Grid/List */}
      <AnimatePresence mode="wait">
        {newsletters.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No newsletters found
            </h3>
            <p className="text-muted-foreground">
              {debouncedSearch
                ? 'Try adjusting your search terms.'
                : 'No newsletters are available for this selection.'}
            </p>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {newsletters.map((newsletter, index) => (
              <motion.div
                key={newsletter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <NewsletterCard newsletter={newsletter} formatSize={formatSize} getMonthColor={getMonthColor} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {newsletters.map((newsletter, index) => (
              <motion.div
                key={newsletter.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <NewsletterListItem newsletter={newsletter} formatSize={formatSize} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button
            onClick={() => fetchNewsletters(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="px-4 py-2 rounded-lg border border-border bg-card text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground px-4">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => fetchNewsletters(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="px-4 py-2 rounded-lg border border-border bg-card text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Newsletter Card Component (Grid View)
interface NewsletterCardProps {
  newsletter: Newsletter;
  formatSize: (bytes: number) => string;
  getMonthColor: (month: number | null) => string;
}

function NewsletterCard({ newsletter, formatSize, getMonthColor }: NewsletterCardProps) {
  return (
    <SpotlightCard
      className="h-full"
      spotlightColor="rgba(59, 130, 246, 0.15)"
    >
      <div className="p-4 flex flex-col h-full">
        {/* PDF Thumbnail/Placeholder */}
        <div className={`aspect-[3/4] rounded-lg bg-gradient-to-br ${getMonthColor(newsletter.month)} mb-4 flex flex-col items-center justify-center relative overflow-hidden group`}>
          {/* Decorative stars */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="20" cy="20" r="1" fill="white" />
              <circle cx="80" cy="30" r="0.5" fill="white" />
              <circle cx="50" cy="15" r="0.8" fill="white" />
              <circle cx="30" cy="70" r="0.6" fill="white" />
              <circle cx="70" cy="80" r="1" fill="white" />
              <circle cx="90" cy="60" r="0.4" fill="white" />
              <circle cx="10" cy="50" r="0.7" fill="white" />
            </svg>
          </div>
          
          {/* Month/Year display */}
          <div className="text-center text-white z-10">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-80" />
            <p className="text-2xl font-bold">{newsletter.monthName || 'Newsletter'}</p>
            {newsletter.year && (
              <p className="text-lg opacity-80">{newsletter.year}</p>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <a
              href={newsletter.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="View PDF"
            >
              <ExternalLink className="h-5 w-5 text-white" />
            </a>
            <a
              href={newsletter.fileUrl}
              download={newsletter.filename}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Download PDF"
            >
              <Download className="h-5 w-5 text-white" />
            </a>
          </div>
        </div>

        {/* Card Content */}
        <div className="flex-1 flex flex-col">
          <h3 className="font-semibold text-foreground line-clamp-1 mb-1">
            {newsletter.title}
          </h3>
          {newsletter.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
              {newsletter.description}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {newsletter.monthName} {newsletter.year}
            </span>
            <span>{formatSize(newsletter.size)}</span>
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}

// Newsletter List Item Component (List View)
interface NewsletterListItemProps {
  newsletter: Newsletter;
  formatSize: (bytes: number) => string;
}

function NewsletterListItem({ newsletter, formatSize }: NewsletterListItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors group">
      {/* Icon */}
      <div className="flex-shrink-0 p-3 rounded-lg bg-primary/10">
        <FileText className="h-6 w-6 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {newsletter.title}
        </h3>
        {newsletter.description && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {newsletter.description}
          </p>
        )}
        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {newsletter.monthName} {newsletter.year}
          </span>
          <span>{formatSize(newsletter.size)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <a
          href={newsletter.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="View PDF"
        >
          <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </a>
        <a
          href={newsletter.fileUrl}
          download={newsletter.filename}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Download PDF"
        >
          <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </a>
      </div>
    </div>
  );
}
