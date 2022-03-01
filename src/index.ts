import { build } from './builder';

import { VERSION } from './version';

import {
  jsonFormatter,
  plaintextFormatter,
  consoleFormatter,
  markdownFormatter
} from './formatters';
import type { Formatter } from './formatters';

import { loadFeatures } from './gherkin';
import { loadJUnitXml } from './junit';
import parseArgs from 'command-line-args';
import type { OptionDefinition } from 'command-line-args';
import { existsSync, writeFileSync } from 'fs';
import { extname } from 'path';

const argDefinitions: OptionDefinition[] = [
  { name: 'features', type: String, multiple: true, defaultOption: true },
  { name: 'junit', alias: 'j', type: String, defaultValue: 'junit.xml' },
  { name: 'format', alias: 'f', type: String, defaultValue: 'console' },
  { name: 'export', alias: 'x', type: String, multiple: true },
  { name: 'version', alias: 'v', type: Boolean }
];

const formatters: Record<string, Formatter> = {
  console: consoleFormatter,
  text: plaintextFormatter,
  txt: plaintextFormatter,
  json: jsonFormatter,
  markdown: markdownFormatter,
  md: markdownFormatter
};

interface Export {
  path: string;
  formatter: Formatter;
}

type ValidatedArgs = {
  mode: 'print' | 'export';
  format?: string;
  junit: string;
  exports?: Export[];
  features: string[];
};

type RawArgs = {
  features: string[];
  junit: string;
  format: string;
  export: string[];
  version: boolean;
};

function validateArgs(): ValidatedArgs {
  const {
    features,
    junit,
    format,
    export: _exports,
    version: showVersion
  } = parseArgs(argDefinitions) as RawArgs;

  if (showVersion) {
    version();
    process.exit(0);
  }

  if ((features || []).length == 0) {
    throw new Error('hm, no features to process');
  }

  const notFoundFeatures = features.reduce<string[]>((prev, curr) => {
    if (!existsSync(curr)) return [...prev, curr];
    return prev;
  }, []);
  if (notFoundFeatures.length > 0) {
    throw new Error(
      `woops, could not find the following features: '${notFoundFeatures.join(', ')}'`
    );
  }

  if (!existsSync(junit)) {
    throw new Error(`strange, could not find the JUnit file '${junit}' ...`);
  }

  let mode: 'print' | 'export' = 'print';

  let exports: Export[] = [];
  if (_exports?.length > 0) {
    mode = 'export';
    exports = _exports.map((file) => {
      const ext = extname(file).slice(1);
      const formatter = formatters[ext];
      if (!formatter) {
        throw new Error(
          `argh! unknown file extension ${ext} to export to; supported: ${Object.keys(
            formatters
          ).join('. ')}`
        );
      }
      return { path: file, formatter };
    });
  } else if (!formatters[format]) {
    throw new Error(
      `unsupported format '${format}'; supported: ${Object.keys(formatters).join(', ')}`
    );
  }
  return {
    mode,
    format,
    junit,
    exports,
    features
  };
}

function version() {
  console.log(`v${VERSION}`);
}

function usage() {
  console.log('TODO: usage');
}

async function main() {
  try {
    const opts = validateArgs();

    const [features, testsuites] = await Promise.all([
      loadFeatures(opts.features),
      loadJUnitXml(opts.junit)
    ]);
    const spec = build(features, testsuites);

    switch (opts.mode) {
      case 'print':
        console.log(formatters[opts.format!](spec).toString());
        break;
      case 'export':
        opts.exports!.forEach((exp) => {
          writeFileSync(exp.path, exp.formatter(spec));
        });
        break;
      default:
        throw new Error(`woot? unknown mode ${opts.mode}`);
    }
  } catch ({ message }) {
    console.error('ERROR:', message);
    usage();
    process.exit(1);
  }
}

(async () => {
  await main();
})();
