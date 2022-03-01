import { Formatter } from '.';
import { LiveSpec } from '../builder';
import { formatTable } from './_util';

/**
 * Format live spec as plain text
 */
export const formatter: Formatter = (spec: LiveSpec) => {
  let buf = spec.features
    .map((feature) => {
      return (
        '[' +
        feature.status.toUpperCase() +
        '] Feature: ' +
        feature.title +
        '\n' +
        feature.scenarios
          .map((scenario) => {
            return (
              `\n\t[${scenario.status.toUpperCase()}] Scenario: ` +
              scenario.title +
              '\n\t\t' +
              scenario.steps
                .map((step) => {
                  let line =
                    step.keyword[0].toUpperCase() + step.keyword.slice(1) + ' ' + step.text;
                  if (step.docstring) {
                    line +=
                      '\n\t\t\t"""\n' +
                      step.docstring.content
                        .split('\n')
                        .map((l) => '\t\t\t' + l)
                        .join('\n') +
                      '\n\t\t\t"""';
                  } else if (step.table) {
                    const table = formatTable(step.table);
                    line += '\n\t\t\t' + table.header;
                    line += '\n\t\t\t' + table.rows.join('\n\t\t\t');
                  }
                  return line;
                })
                .join('\n\t\t')
            );
          })
          .join('\n\t')
      );
    })
    .join('\n\n');
  return Buffer.from(buf);
};
