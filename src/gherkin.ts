import glob from 'glob';
import { readFileSync } from 'fs';
import { GherkinStreams } from '@cucumber/gherkin-streams';
import { Envelope, PickleTable, Source, SourceMediaType, Step } from '@cucumber/messages';

export interface ParsedFeature {
  title: string;
  tags?: string[];
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
  docstring?: Docstring;
  table?: Table;
}

export interface Docstring {
  mediaType?: string;
  content: string;
}

export interface Table {
  header: string[];
  rows: string[][];
}

/* istanbul ignore next */
// async wrapper around glob
function asyncGlob(pattern: string): Promise<string[]> {
  return new Promise((res, rej) => {
    glob(pattern, (err, list) => {
      if (err) return rej(err);
      res(list);
    });
  });
}

/* istanbul ignore next */
// async. load features from either glob or list of files.
export async function loadFeatures(globOrList: string | string[]): Promise<ParsedFeature[]> {
  let list: string[] =
    typeof globOrList === 'string' ? await asyncGlob(globOrList) : (globOrList as string[]);

  return Promise.all(
    list.map(async (file) => {
      const data = readFileSync(file, 'utf8');
      return await parseFeature({
        data,
        mediaType: file.endsWith('.md')
          ? SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_MARKDOWN
          : SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN,
        uri: file
      });
    })
  );
}

// parse feature from file content
// TODO: support rules
export async function parseFeature(source: Source): Promise<ParsedFeature> {
  return new Promise((res, rej) => {
    const steps: Record<string, Step> = {};
    const feature: ParsedFeature = { title: '', scenarios: [] };
    const stream = GherkinStreams.fromSources([{ source }], {
      includeGherkinDocument: true,
      includePickles: true,
      includeSource: false
    });
    stream.on('data', (envelope: Envelope) => {
      if (envelope.gherkinDocument) {
        feature.title = envelope.gherkinDocument.feature!.name;
        feature.tags = envelope.gherkinDocument.feature!.tags.map((tag) => tag.name);
        envelope.gherkinDocument.feature!.children.forEach((child) => {
          (child.scenario || child.background)?.steps.forEach((step) => {
            steps[step.id] = step;
          });
        }, {} as Record<string, Step>);
      } else if (envelope.pickle) {
        feature.scenarios.push({
          title: envelope.pickle!.name,
          tags: envelope.pickle!.tags.map((tag) => tag.name),
          steps: envelope.pickle.steps.map(
            (step) =>
              ({
                text: step.text,
                keyword: steps[step.astNodeIds[0]].keyword.trim(),
                docstring: step.argument?.docString
                  ? (step.argument.docString as Docstring)
                  : undefined,
                table: step.argument?.dataTable ? table(step.argument.dataTable) : undefined
              } as ParsedStep)
          )
        } as ParsedScenario);
      }
    });
    stream.on('end', () => {
      res(feature);
    });
    stream.on('error', (err) => {
      rej(err);
    });
  });
}

function table(from: PickleTable): Table {
  return {
    header: from.rows[0].cells.map((cell) => cell.value),
    rows: from.rows.slice(1).map((row) => row.cells.map((cell) => cell.value))
  };
}
