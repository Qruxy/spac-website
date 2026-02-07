/**
 * Shared utilities for the PHP-to-PostgreSQL migration.
 */

export type MembershipTypeEnum = 'FREE' | 'INDIVIDUAL' | 'FAMILY' | 'STUDENT' | 'LIFETIME';

/**
 * Parse a date string from MariaDB, converting '0000-00-00' and empty strings to null.
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr === '0000-00-00' || dateStr === '0000-00-00 00:00:00' || dateStr.trim() === '') {
    return null;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Extract an email address from strings that may contain angle brackets.
 * e.g., "John ONeill <starionjohn@icloud.com>" -> "starionjohn@icloud.com"
 */
export function extractEmail(raw: string | null | undefined): string | null {
  if (!raw || raw.trim() === '') return null;
  // Check for angle bracket format
  const angleBracket = raw.match(/<([^>]+)>/);
  if (angleBracket) return angleBracket[1].trim().toLowerCase();
  // Check if it looks like a valid email
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  return null;
}

/**
 * Normalize a phone number to a consistent format.
 * Returns the original cleaned-up string or null if empty.
 */
export function parsePhone(phone: string | null | undefined): string | null {
  if (!phone || phone.trim() === '') return null;
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return null;
  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  // 11 digits starting with 1
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  // Return as-is if non-standard
  return phone.trim();
}

/**
 * Map legacy membership type string to Prisma enum.
 */
export function mapMembershipType(legacy: string | null | undefined): MembershipTypeEnum {
  if (!legacy) return 'FREE';
  const normalized = legacy.trim().toLowerCase();
  switch (normalized) {
    case 'single': return 'INDIVIDUAL';
    case 'family': return 'FAMILY';
    case 'life': return 'LIFETIME';
    case 'student': return 'STUDENT';
    case 'patron': return 'INDIVIDUAL';
    case 'benefactor': return 'INDIVIDUAL';
    case 'subscriber': return 'FREE';
    case 'cancel': return 'FREE';
    default: return 'INDIVIDUAL';
  }
}

/**
 * Determine membership status from renewal date and type.
 */
export function getMembershipStatus(
  renewDateStr: string | null | undefined,
  membershipType: string | null | undefined
): 'ACTIVE' | 'EXPIRED' | 'PENDING' {
  // Life members are always active
  if (membershipType?.trim().toLowerCase() === 'life') return 'ACTIVE';

  const renewDate = parseDate(renewDateStr);
  if (!renewDate) return 'EXPIRED';

  return renewDate > new Date() ? 'ACTIVE' : 'EXPIRED';
}

/**
 * Map motion status from legacy to Prisma enum.
 */
export function mapMotionStatus(legacy: string): 'PROPOSED' | 'PASSED' | 'FAILED' | 'TABLED' {
  const normalized = legacy.trim().toLowerCase();
  if (normalized === 'carried' || normalized === 'passed') return 'PASSED';
  if (normalized === 'failed' || normalized === 'defeated') return 'FAILED';
  if (normalized === 'tabled') return 'TABLED';
  return 'PASSED'; // Default for historical records
}

/**
 * Structured migration logger.
 */
export class MigrationLogger {
  private counts: Record<string, { success: number; skipped: number; failed: number }> = {};

  section(title: string) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${title}`);
    console.log('='.repeat(60));
  }

  info(msg: string) {
    console.log(`  ${msg}`);
  }

  warn(msg: string) {
    console.log(`  [WARN] ${msg}`);
  }

  error(msg: string, err?: unknown) {
    console.error(`  [ERROR] ${msg}`, err instanceof Error ? err.message : '');
  }

  track(entity: string, result: 'success' | 'skipped' | 'failed') {
    if (!this.counts[entity]) {
      this.counts[entity] = { success: 0, skipped: 0, failed: 0 };
    }
    this.counts[entity][result]++;
  }

  summary() {
    this.section('MIGRATION SUMMARY');
    for (const [entity, counts] of Object.entries(this.counts)) {
      this.info(`${entity}: ${counts.success} created, ${counts.skipped} skipped, ${counts.failed} failed`);
    }
  }
}
