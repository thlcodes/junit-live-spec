import type { Testsuite } from "./junit";

import type { ParsedFeature } from "./gherkin";

import chalk from "chalk";

type Status = "failed" | "succeeded" | "pending" | "skipped";
interface Step {
  word: string;
  text: string;
  table?: Record<string, string>[];
  docstring?: string;
}
interface Scenario {
  name: string;
  status: Status;
  tags: string[];
  steps: Step[];
}
interface Feature {
  name: string;
  timestamp?: string;
  status: Status;
  tags: string[];
  scenarios: Scenario[];
}
interface LiveSpec {
  timestamp: string;
  features: Feature[];
}

export function build(
  parsedFeatures: ParsedFeature[],
  testsuites: Testsuite[]
): LiveSpec {
  const spec: LiveSpec = {
    timestamp: new Date().toISOString(),
    features: parsedFeatures.map(({ title, tags, scenarios }) => {
      const testsuite = testsuites.find((ts) => ts.name == title);
      const feature: Feature = {
        name: title,
        tags,
        timestamp: testsuite?.timestamp,
        status: testsuite?.status || "pending",
        scenarios: scenarios.map(
          ({ title: scenarioTitle, tags: scenarioTags, steps }) => {
            const testcase = testsuite
              ? testsuite.testcases.find(
                  (tc) => tc.name == `${title} ${scenarioTitle}`
                )
              : undefined;
            const scenario: Scenario = {
              name: scenarioTitle,
              tags: scenarioTags,
              status: testcase?.status || "pending",
              steps: steps.map(
                ({ keyword, text, docstring, table }) =>
                  ({
                    word: keyword,
                    text,
                    docstring,
                    table,
                  } as Step)
              ),
            };
            return scenario;
          }
        ),
      };
      return feature;
    }),
  };
  return spec;
}

// exporters

export type Exporter = (spec: LiveSpec) => Buffer;

/**
 * Exports live spec as json
 */
export const jsonExporter: Exporter = (spec) => {
  return Buffer.from(JSON.stringify(spec, null, "  "));
};

const statusColors = {
  succeeded: chalk.green,
  failed: chalk.red,
  skipped: chalk.yellowBright,
  pending: chalk.yellow,
};

/**
 * Exports live spec as (colored) console output
 */
export const consoleExporter: Exporter = (spec) => {
  let buf = spec.features
    .map((feature) => {
      return (
        statusColors[feature.status].underline.bold(
          "Feature: " + feature.name
        ) +
        "\n" +
        feature.scenarios
          .map((scenario) => {
            return (
              statusColors[scenario.status].underline(
                "\n\tScenario: " + scenario.name
              ) +
              "\n\t\t" +
              statusColors[scenario.status].dim(
                scenario.steps
                  .map((step) => {
                    let line =
                      statusColors[scenario.status].bold(
                        step.word[0].toUpperCase() + step.word.slice(1)
                      ) +
                      " " +
                      step.text;
                    if (step.docstring) {
                      line += chalk.italic(
                        '\n\t\t\t"""\n' +
                          step.docstring
                            .split("\n")
                            .map((l) => "\t\t\t" + l)
                            .join("\n") +
                          '\n\t\t\t"""'
                      );
                    } else if (step.table && step.table.length > 0) {
                      const table = printTable(step.table);
                      line += "\n\t\t\t" + table.header;
                      line += "\n\t\t\t" + table.rows.join("\n\t\t\t");
                    }
                    return line;
                  })
                  .join("\n\t\t")
              )
            );
          })
          .join("\n\t")
      );
    })
    .join("\n\n");
  return Buffer.from(buf);
};

/**
 * Exports live spec as plain text
 * @type {Exporter}
 */
export const plaintextExporter: Exporter = (spec) => {
  let buf = spec.features
    .map((feature) => {
      return (
        "[" +
        feature.status.toUpperCase() +
        "] Feature: " +
        feature.name +
        "\n" +
        feature.scenarios
          .map((scenario) => {
            return (
              `\n\t[${scenario.status.toUpperCase()}] Scenario: ` +
              scenario.name +
              "\n\t\t" +
              scenario.steps
                .map((step) => {
                  let line =
                    step.word[0].toUpperCase() +
                    step.word.slice(1) +
                    " " +
                    step.text;
                  if (step.docstring) {
                    line +=
                      '\n\t\t\t"""\n' +
                      step.docstring
                        .split("\n")
                        .map((l) => "\t\t\t" + l)
                        .join("\n") +
                      '\n\t\t\t"""';
                  } else if (step.table && step.table.length > 0) {
                    const table = printTable(step.table);
                    line += "\n\t\t\t" + table.header;
                    line += "\n\t\t\t" + table.rows.join("\n\t\t\t");
                  }
                  return line;
                })
                .join("\n\t\t")
            );
          })
          .join("\n\t")
      );
    })
    .join("\n\n");
  return Buffer.from(buf);
};

const statusSymbols = {
  succeeded: "✅",
  failed: "❌",
  skipped: "🤷",
  pending: "⏱",
};

/**
 * Exports live spec as simple markdown
 */
export const markdownExporter: Exporter = (spec) => {
  let buf = spec.features
    .map((feature) => {
      return (
        "# " +
        statusSymbols[feature.status] +
        " Feature: " +
        feature.name +
        "\n" +
        feature.scenarios
          .map((scenario) => {
            return (
              "\n## " +
              statusSymbols[scenario.status] +
              " Scenario: " +
              scenario.name +
              "\n" +
              scenario.steps
                .map((step) => {
                  let line =
                    "> **" +
                    step.word[0].toUpperCase() +
                    step.word.slice(1) +
                    "** " +
                    step.text;
                  if (step.docstring) {
                    const tag = step.text.split(" ").splice(-1);
                    line +=
                      "\n```" +
                      tag +
                      "\n" +
                      step.docstring.split("\n").join("\n") +
                      "\n```\n";
                  } else if (step.table && step.table.length > 0) {
                    const table = printTable(step.table);
                    line += "\n\n" + table.header;
                    line += "\n" + table.separator;
                    line += "\n" + table.rows.join("\n") + "\n";
                  }
                  return line;
                })
                .join("<br/>\n")
            );
          })
          .join("<br/>\n")
      );
    })
    .join("\n\n");
  return Buffer.from(buf);
};

/**
 * Print given table to string
 */
function printTable(table: Record<string, string>[]): {
  header: string;
  separator: string;
  rows: string[];
} {
  const max: Record<string, number> = {};
  table.forEach((row) => {
    Object.keys(row).forEach((header) => {
      if (!max[header]) max[header] = header.length;
      if (row[header].length > (max[header] || 0))
        max[header] = row[header].length;
    });
  });
  const header = Object.keys(table[0]).reduce((c, n) => {
    return c + " " + n + " ".repeat(max[n] - n.length) + " |";
  }, "|");
  const separator = Object.keys(table[0]).reduce((c, n) => {
    return c + " " + "-".repeat(max[n]) + " |";
  }, "|");
  const rows = table.map((row) => {
    return Object.keys(row).reduce((c, n) => {
      const v = row[n];
      return c + " " + v + " ".repeat(max[n] - v.length) + " |";
    }, "|");
  });
  return {
    header,
    separator,
    rows,
  };
}
