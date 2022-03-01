import { Table } from '../../gherkin';
import { formatTable, FormattedTable } from '../_util';

describe('formatters/utils', () => {
  test('format table', () => {
    const table: Table = {
      header: ['A', 'BC', 'DEFGH'],
      rows: [
        ['1', '2', '3'],
        ['4', '5', '6']
      ]
    };
    const want: FormattedTable = {
      header: '| A | BC | DEFGH |',
      separator: '| - | -- | ----- |',
      rows: ['| 1 | 2  | 3     |', '| 4 | 5  | 6     |']
    };
    expect(formatTable(table)).toEqual(want);
  });
});
