export interface ParsedFeature {
  title: string;
  tags: string[];
  scenarios: ParsedScenario[];
}

export interface ParsedScenario {
  title: string;
  tags: string[];
  steps: ParsedStep[];
}

export interface ParsedStep {
  keyword: string;
  text: string;
  docstring?: string;
  table?: unknown;
}

export function loadFeatures(globOrList: string | string[]): ParsedFeature[] {
  return [];
}
