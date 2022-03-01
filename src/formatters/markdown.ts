import { Formatter } from '.';
import { LiveSpec } from '../builder';
import { formatTable } from './_util';

const statusSymbols = {
  success: '✅',
  error: '❌',
  failure: '❌',
  skipped: '🤷',
  pending: '⏱'
};

/**
 * Format live spec as simple markdown
 */
export const formatter: Formatter = (spec: LiveSpec) => {
  let buf = spec.features
    .map((feature) => {
      return (
        '# ' +
        statusSymbols[feature.status] +
        ' Feature: ' +
        feature.title +
        '\n' +
        feature.scenarios
          .map((scenario) => {
            return (
              '\n## ' +
              statusSymbols[scenario.status] +
              ' Scenario: ' +
              scenario.title +
              '\n' +
              scenario.steps
                .map((step) => {
                  let line =
                    '> **' +
                    step.keyword[0].toUpperCase() +
                    step.keyword.slice(1) +
                    '** ' +
                    step.text;
                  if (step.docstring) {
                    const tag = step.text.split(' ').splice(-1);
                    line +=
                      '\n```' +
                      tag +
                      '\n' +
                      step.docstring.content.split('\n').join('\n') +
                      '\n```\n';
                  } else if (step.table) {
                    const table = formatTable(step.table);
                    line += '\n\n' + table.header;
                    line += '\n' + table.separator;
                    line += '\n' + table.rows.join('\n') + '\n';
                  }
                  return line;
                })
                .join('   \n')
            );
          })
          .join('<br/>\n')
      );
    })
    .join('\n\n');
  return Buffer.from(buf);
};
