import {
  build,
  jsonExporter,
  plaintextExporter,
  consoleExporter,
  markdownExporter,
} from "./livespec";

import { loadFeatures } from "./gherkin";
import { loadJUnitXml } from "./junit";
import type { Exporter } from "./livespec";
import parseArgs from "command-line-args";
import type { OptionDefinition } from "command-line-args";
import { existsSync, writeFileSync } from "fs";
import { extname } from "path";

const argDefinitions: OptionDefinition[] = [
  { name: "features", type: String, multiple: true, defaultOption: true },
  { name: "junit", alias: "j", type: String, defaultValue: "junit.xml" },
  { name: "format", alias: "f", type: String, defaultValue: "console" },
  { name: "export", alias: "x", type: String, multiple: true },
];

const exporters: Record<string, Exporter> = {
  console: consoleExporter,
  text: plaintextExporter,
  txt: plaintextExporter,
  json: jsonExporter,
  markdown: markdownExporter,
  md: markdownExporter,
};

interface Export {
  path: string;
  exporter: import("./livespec.js").Exporter;
}

function validateArgs(): {
  mode: "print" | "export";
  format?: string;
  exports?: Export[];
  features: string[];
} {
  const {
    features,
    junit,
    format,
    export: _exports,
  }: {
    features: string[];
    junit: string;
    format: string;
    export: string[];
  } = parseArgs(argDefinitions) as any;

  if ((features || []).length == 0) {
    throw new Error("hm, no features to process");
  }

  const notFoundFeatures = features.reduce<string[]>((prev, curr) => {
    if (!existsSync(curr)) return [...prev, curr];
    return prev;
  }, []);
  if (notFoundFeatures.length > 0) {
    throw new Error(
      `woops, could not find the following features: '${notFoundFeatures.join(
        ", "
      )}'`
    );
  }

  if (!existsSync(junit)) {
    throw new Error(`strange, could not find the JUnit file '${junit}' ...`);
  }

  let mode: "print" | "export" = "print";

  let exports: Export[] = [];
  if (_exports?.length > 0) {
    mode = "export";
    exports = _exports.map((file) => {
      const ext = extname(file).slice(1);
      const exporter = exporters[ext];
      if (!exporter) {
        throw new Error(
          `argh! unknown file extension ${ext} to export to; supported: ${Object.keys(
            exporters
          ).join(". ")}`
        );
      }
      return { path: file, exporter };
    });
  } else if (!exporters[format]) {
    throw new Error(
      `unsupported format '${format}'; supported: ${Object.keys(exporters).join(
        ", "
      )}`
    );
  }
  return {
    mode,
    format,
    exports,
    features,
  };
}

function usage() {
  console.log(`TODO: usage`);
}

async function main() {
  try {
    const opts = validateArgs();

    const [features, testsuites] = await Promise.all([
      loadFeatures("./e2e/features/*.feature"),
      loadJUnitXml("./e2e.junit.xml"),
    ]);
    const spec = build(features, testsuites);

    switch (opts.mode) {
      case "print":
        console.log(exporters[opts.format!](spec).toString());
        break;
      case "export":
        opts.exports!.forEach((exp) => {
          writeFileSync(exp.path, exp.exporter(spec));
        });
        break;
      default:
        throw new Error(`woot? unknown mode ${opts.mode}`);
    }
  } catch ({ message }) {
    console.error("ERROR:", message);
    usage();
    process.exit(1);
  }
}

(async () => {
  await main();
})();
