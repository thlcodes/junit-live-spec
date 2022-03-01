import type { Testsuite } from './junit';

import type { ParsedFeature, ParsedScenario, ParsedStep } from './gherkin';
import type { Teststatus } from './junit';

export type Status = Teststatus | 'pending';

export type Step = ParsedStep;

export interface Scenario extends ParsedScenario {
  status: Status;
  steps: Step[];
}

export interface Feature extends ParsedFeature {
  timestamp?: string;
  status: Status;
  scenarios: Scenario[];
}

export interface LiveSpec {
  timestamp: string;
  features: Feature[];
}

export function build(parsedFeatures: ParsedFeature[], testsuites: Testsuite[]): LiveSpec {
  const spec: LiveSpec = {
    timestamp: new Date().toISOString(),
    features: parsedFeatures.map(({ title, tags, scenarios }) => {
      const testsuite = testsuites.find((ts) => ts.name == title);
      const feature: Feature = {
        title,
        tags,
        timestamp: testsuite?.timestamp,
        status: testsuite?.status || 'pending',
        scenarios: scenarios.map(({ title: scenarioTitle, tags: scenarioTags, steps }) => {
          const testcase = testsuite
            ? testsuite.testcases.find((tc) => tc.name == `${title} ${scenarioTitle}`)
            : undefined;
          const scenario: Scenario = {
            title: scenarioTitle,
            tags: scenarioTags,
            status: testcase?.status || 'pending',
            steps: steps.map(
              ({ keyword, text, docstring, table }) =>
                ({
                  keyword,
                  text,
                  docstring,
                  table
                } as Step)
            )
          };
          return scenario;
        })
      };
      return feature;
    })
  };
  return spec;
}
