/**
 * SQL Parser for MariaDB/phpMyAdmin dump files.
 *
 * Parses INSERT INTO statements and returns structured data.
 * Handles: escaped quotes, NULL values, multi-line strings, numeric types.
 */

import * as fs from 'fs';
import type { ParsedTables } from './types';

/**
 * Parse all INSERT statements from a MariaDB SQL dump file.
 * Returns a Map of table name -> array of row objects.
 */
export function parseSqlDump(filePath: string): ParsedTables {
  const sql = fs.readFileSync(filePath, 'utf-8');
  const tables: ParsedTables = new Map();

  // Find all INSERT INTO blocks
  // Pattern: INSERT INTO `tableName` (`col1`, `col2`, ...) VALUES
  const insertRegex = /INSERT INTO `(\w+)` \(([^)]+)\) VALUES\s*\n?([\s\S]*?);(?=\s*(?:--|INSERT|CREATE|ALTER|DROP|\/\*|$))/g;

  let match;
  while ((match = insertRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const columnsRaw = match[2];
    const valuesBlock = match[3];

    // Parse column names
    const columns = columnsRaw
      .split(',')
      .map(c => c.trim().replace(/`/g, ''));

    // Parse value tuples
    const rows = parseValueTuples(valuesBlock, columns);

    // Merge with existing (some tables have multiple INSERT statements)
    const existing = tables.get(tableName) || [];
    tables.set(tableName, [...existing, ...rows]);
  }

  return tables;
}

/**
 * Parse the VALUES portion of an INSERT statement into row objects.
 * Uses a state machine to handle quoted strings, escapes, and nested parentheses.
 */
function parseValueTuples(valuesBlock: string, columns: string[]): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  let i = 0;
  const len = valuesBlock.length;

  while (i < len) {
    // Skip whitespace and commas between tuples
    while (i < len && (valuesBlock[i] === ' ' || valuesBlock[i] === '\n' || valuesBlock[i] === '\r' || valuesBlock[i] === ',' || valuesBlock[i] === '\t')) {
      i++;
    }
    if (i >= len) break;

    // Expect opening parenthesis
    if (valuesBlock[i] !== '(') {
      i++;
      continue;
    }
    i++; // Skip '('

    // Parse values within this tuple
    const values: unknown[] = [];

    while (i < len) {
      // Skip leading whitespace
      while (i < len && (valuesBlock[i] === ' ' || valuesBlock[i] === '\t')) i++;

      if (i >= len || valuesBlock[i] === ')') {
        i++; // Skip ')'
        break;
      }

      if (valuesBlock[i] === ',') {
        i++; // Skip comma between values
        continue;
      }

      // Parse a single value
      const [value, newIdx] = parseValue(valuesBlock, i);
      values.push(value);
      i = newIdx;
    }

    // Build row object from columns and values
    if (values.length === columns.length) {
      const row: Record<string, unknown> = {};
      for (let j = 0; j < columns.length; j++) {
        row[columns[j]] = values[j];
      }
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Parse a single value starting at position i.
 * Returns [parsedValue, newIndex].
 */
function parseValue(s: string, i: number): [unknown, number] {
  // NULL
  if (s.substring(i, i + 4).toUpperCase() === 'NULL') {
    return [null, i + 4];
  }

  // Quoted string
  if (s[i] === '\'') {
    return parseQuotedString(s, i);
  }

  // Number (including negative and decimal)
  if (s[i] === '-' || s[i] === '.' || (s[i] >= '0' && s[i] <= '9')) {
    return parseNumber(s, i);
  }

  // Unquoted identifier/keyword (e.g., DEFAULT)
  let end = i;
  while (end < s.length && s[end] !== ',' && s[end] !== ')') {
    end++;
  }
  return [s.substring(i, end).trim(), end];
}

/**
 * Parse a single-quoted SQL string, handling escape sequences.
 */
function parseQuotedString(s: string, i: number): [string, number] {
  i++; // Skip opening quote
  let result = '';

  while (i < s.length) {
    if (s[i] === '\\') {
      // Escape sequence
      i++;
      if (i >= s.length) break;
      switch (s[i]) {
        case '\'': result += '\''; break;
        case '"': result += '"'; break;
        case '\\': result += '\\'; break;
        case 'n': result += '\n'; break;
        case 'r': result += '\r'; break;
        case 't': result += '\t'; break;
        case '0': result += '\0'; break;
        default: result += s[i]; break;
      }
      i++;
    } else if (s[i] === '\'' && i + 1 < s.length && s[i + 1] === '\'') {
      // Doubled quote escape
      result += '\'';
      i += 2;
    } else if (s[i] === '\'') {
      // End of string
      i++;
      break;
    } else {
      result += s[i];
      i++;
    }
  }

  return [result, i];
}

/**
 * Parse a numeric value (integer or decimal).
 */
function parseNumber(s: string, i: number): [number, number] {
  let end = i;
  if (s[end] === '-') end++;
  while (end < s.length && ((s[end] >= '0' && s[end] <= '9') || s[end] === '.')) {
    end++;
  }
  const numStr = s.substring(i, end);
  const num = numStr.includes('.') ? parseFloat(numStr) : parseInt(numStr, 10);
  return [isNaN(num) ? 0 : num, end];
}
