import { Table } from '../gherkin';

export interface FormattedTable {
  header: string;
  separator: string;
  rows: string[];
}

/**
 * Format a given table for usage in plaintext/console/markdown ...
 */
export function formatTable(table: Table): FormattedTable {
  const max: number[] = [];
  [...table.rows, table.header].forEach((row) => {
    row.forEach((entry, index) => {
      if (entry.length > (max[index] || 0)) max[index] = entry.length;
    });
  });
  let header = '|';
  let separator = '|';
  table.header.forEach((n, index) => {
    header += ' ' + n + ' '.repeat(max[index] - n.length) + ' |';
    separator += ' ' + '-'.repeat(max[index]) + ' |';
  }, '|');
  const rows = table.rows.map((row) => {
    return row.reduce((c, v, index) => {
      return c + ' ' + v + ' '.repeat(max[index] - v.length) + ' |';
    }, '|');
  });
  return {
    header,
    separator,
    rows
  };
}
