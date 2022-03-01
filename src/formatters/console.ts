import chalk from 'chalk';

import { formatTable } from './_util';
import { Formatter } from '.';
import { LiveSpec } from '../builder';

const statusColors = {
  success: chalk.green,
  failure: chalk.red,
  error: chalk.red,
  skipped: chalk.yellowBright,
  pending: chalk.yellow
};

/**
 * Format live spec as (colored) console output
 */
export const formatter: Formatter = (spec: LiveSpec) => {
  let buf = spec.features
    .map((feature) => {
      return (
        statusColors[feature.status].underline.bold('Feature: ' + feature.title) +
        '\n' +
        feature.scenarios
          .map((scenario) => {
            return (
              statusColors[scenario.status].underline('\n\tScenario: ' + scenario.title) +
              '\n\t\t' +
              statusColors[scenario.status].dim(
                scenario.steps
                  .map((step) => {
                    let line =
                      statusColors[scenario.status].bold(
                        step.keyword[0].toUpperCase() + step.keyword.slice(1)
                      ) +
                      ' ' +
                      step.text;
                    if (step.docstring) {
                      line += chalk.italic(
                        '\n\t\t\t"""\n' +
                          step.docstring.content
                            .split('\n')
                            .map((l) => '\t\t\t' + l)
                            .join('\n') +
                          '\n\t\t\t"""'
                      );
                    } else if (step.table) {
                      const table = formatTable(step.table);
                      line += '\n\t\t\t' + table.header;
                      line += '\n\t\t\t' + table.rows.join('\n\t\t\t');
                    }
                    return line;
                  })
                  .join('\n\t\t')
              )
            );
          })
          .join('\n\t')
      );
    })
    .join('\n\n');
  return Buffer.from(buf);
};
