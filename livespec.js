import { loadFeatures as loadGlob, loadFeature as loadOne } from 'jest-cucumber';
import { parseStringPromise as parseXml } from 'xml2js';
import { readFileSync } from 'fs';
import chalk from 'chalk';

/**
 * @typedef {import('jest-cucumber/dist/src/models').ParsedFeature} ParsedFeature
 */

/**
 * Load all features from `glob`
 * @param {string|string[]} globOrList
 * @returns {ParsedFeature[]}
 */
export function loadFeatures(globOrList) {
  const features =
    globOrList instanceof Array ? globOrList.map((p) => loadOne(p)) : loadGlob(globOrList);
  return features;
}

/**
 * @typedef {{name: string, status: 'failed'|'succeeded'|'skipped', message?: string, time?: string, skipped: boolean}} Testcase
 * @typedef {{name: string, status: 'failed'|'succeeded'|'skipped', timestamp?: string, testcases: Testcase[]}} Testsuite
 */

/**
 * Load test results from junit xml file at `path`
 * Converts xml to Array of `Testsuire`
 * @param {string} path
 * @returns {Promise<Testsuite[]>}
 */
export async function loadJUnitXml(path) {
  const xml = readFileSync(path);
  const { testsuites } = await parseXml(xml);
  return (testsuites?.testsuite || []).map(
    ({ $: { name, timestamp, failures, errors }, testcase: testcases }) => ({
      name,
      timestamp,
      status: Number.parseInt(failures) + Number.parseInt(errors) > 0 ? 'failed' : 'succeeded',
      testcases: testcases.map(({ $: { name, time }, failure, skipped }) => ({
        name,
        time,
        status: failure ? 'failed' : skipped ? 'skipped' : 'succeeded',
        message: failure
      }))
    })
  );
}

/**
 * @typedef {('failed'|'succeeded'|'pending|'skipped')} Status
 * @typedef {{word: string, text: string, table?: Record[], docstring?: string}} Step
 * @typedef {{name: string, status: Status, tags: string[], steps: Step[]}} Scenario
 * @typedef {{name: string, timestamp?: string, status: Status, tags: string[], scenarios: Scenario[] }} Feature
 * @typedef {{timestamp: string, features: SpecFeature[] }} LiveSpec
 */

/**
 *
 * @param {ParsedFeature[]} parsedFeatures
 * @param {Testsuite[]} testsuites
 * @returns {LiveSpec}
 */
export function build(parsedFeatures, testsuites) {
  /** @type {LiveSpec} */
  const spec = {
    timestamp: new Date().toISOString(),
    features: parsedFeatures.map(({ title, tags, scenarios, scenarioOutlines }) => {
      const testsuite = testsuites.find((ts) => ts.name == title);
      /** @type {Feature} */
      const feature = {
        name: title,
        tags,
        timestamp: testsuite?.timestamp,
        status: testsuite?.status || 'pending',
        scenarios: [...scenarios, ...scenarioOutlines.flatMap((so) => so.scenarios)].map(
          ({ title: scenarioTitle, tags: scenarioTags, steps }) => {
            const testcase = testsuite
              ? testsuite.testcases.find((tc) => tc.name == `${title} ${scenarioTitle}`)
              : undefined;
            /** @type {Scenario} */
            const scenario = {
              name: scenarioTitle,
              tags: scenarioTags,
              status: testcase?.status || 'pending',
              steps: steps.map(({ keyword, stepText, stepArgument }) => ({
                word: keyword,
                text: stepText,
                docstring:
                  stepArgument && typeof stepArgument == 'string' && stepArgument != ''
                    ? stepArgument
                    : undefined,
                table:
                  stepArgument && stepArgument instanceof Array && stepArgument.length > 0
                    ? stepArgument
                    : undefined
              }))
            };
            return scenario;
          }
        )
      };
      return feature;
    })
  };
  return spec;
}

// exporters

/**
 * @typedef {(spec: LiveSpec) => Buffer} Exporter
 */

/**
 * Exports live spec as json
 * @type {Exporter}
 */
export function jsonExporter(spec) {
  return Buffer.from(JSON.stringify(spec, null, '  '));
}

const statusColors = {
  succeeded: chalk.green,
  failed: chalk.red,
  skipped: chalk.yellowBright,
  pending: chalk.yellow
};

/**
 * Exports live spec as (colored) console output
 * @type {Exporter}
 */
export function consoleExporter(spec) {
  let buf = spec.features
    .map((feature) => {
      return (
        statusColors[feature.status].underline.bold('Feature: ' + feature.name) +
        '\n' +
        feature.scenarios
          .map((scenario) => {
            return (
              statusColors[scenario.status].underline('\n\tScenario: ' + scenario.name) +
              '\n\t\t' +
              statusColors[scenario.status].dim(
                scenario.steps
                  .map((step) => {
                    let line =
                      statusColors[scenario.status].bold(
                        step.word[0].toUpperCase() + step.word.slice(1)
                      ) +
                      ' ' +
                      step.text;
                    if (step.docstring) {
                      line += chalk.italic(
                        '\n\t\t\t"""\n' +
                          step.docstring
                            .split('\n')
                            .map((l) => '\t\t\t' + l)
                            .join('\n') +
                          '\n\t\t\t"""'
                      );
                    } else if (step.table && step.table.length > 0) {
                      const table = printTable(step.table);
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
}

/**
 * Exports live spec as plain text
 * @type {Exporter}
 */
export function plaintextExporter(spec) {
  let buf = spec.features
    .map((feature) => {
      return (
        '[' +
        feature.status.toUpperCase() +
        '] Feature: ' +
        feature.name +
        '\n' +
        feature.scenarios
          .map((scenario) => {
            return (
              `\n\t[${scenario.status.toUpperCase()}] Scenario: ` +
              scenario.name +
              '\n\t\t' +
              scenario.steps
                .map((step) => {
                  let line = step.word[0].toUpperCase() + step.word.slice(1) + ' ' + step.text;
                  if (step.docstring) {
                    line +=
                      '\n\t\t\t"""\n' +
                      step.docstring
                        .split('\n')
                        .map((l) => '\t\t\t' + l)
                        .join('\n') +
                      '\n\t\t\t"""';
                  } else if (step.table && step.table.length > 0) {
                    const table = printTable(step.table);
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
}

const statusSymbols = {
  succeeded: '✅',
  failed: '❌',
  skipped: '🤷',
  pending: '⏱'
};

/**
 * Exports live spec as simple markdown
 * @type {Exporter}
 */
export function markdownExporter(spec) {
  let buf = spec.features
    .map((feature) => {
      return (
        '# ' +
        statusSymbols[feature.status] +
        ' Feature: ' +
        feature.name +
        '\n' +
        feature.scenarios
          .map((scenario) => {
            return (
              '\n## ' +
              statusSymbols[scenario.status] +
              ' Scenario: ' +
              scenario.name +
              '\n' +
              scenario.steps
                .map((step) => {
                  let line =
                    '> **' + step.word[0].toUpperCase() + step.word.slice(1) + '** ' + step.text;
                  if (step.docstring) {
                    const tag = step.text.split(' ').splice(-1);
                    line +=
                      '\n```' + tag + '\n' + step.docstring.split('\n').join('\n') + '\n```\n';
                  } else if (step.table && step.table.length > 0) {
                    const table = printTable(step.table);
                    line += '\n\n' + table.header;
                    line += '\n' + table.separator;
                    line += '\n' + table.rows.join('\n') + '\n';
                  }
                  return line;
                })
                .join('<br/>\n')
            );
          })
          .join('<br/>\n')
      );
    })
    .join('\n\n');
  return Buffer.from(buf);
}

/**
 * Print given table to string
 * @param {Record<string, string>[]} table
 * @returns {{header: string, rows: string[]}}
 */
function printTable(table) {
  const max = {};
  table.forEach((row) => {
    Object.keys(row).forEach((header) => {
      if (!max[header]) max[header] = header.length;
      if (row[header].length > (max[header] || 0)) max[header] = row[header].length;
    });
  });
  const header = Object.keys(table[0]).reduce((c, n) => {
    return c + ' ' + n + ' '.repeat(max[n] - n.length) + ' |';
  }, '|');
  const separator = Object.keys(table[0]).reduce((c, n) => {
    return c + ' ' + '-'.repeat(max[n]) + ' |';
  }, '|');
  const rows = table.map((row) => {
    return Object.keys(row).reduce((c, n) => {
      const v = row[n];
      return c + ' ' + v + ' '.repeat(max[n] - v.length) + ' |';
    }, '|');
  });
  return {
    header,
    separator,
    rows
  };
}
