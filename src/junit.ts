import { readFileSync } from "fs";
import { parseStringPromise as parseXml } from "xml2js";

interface JUnitTestcase {
  $: { name: string; time: string };
  failure: string;
  skipped: unknown;
}
interface JUnitTestsuite {
  $: { name: string; timestamp: string; failures: string; errors: string };
  testcase: JUnitTestcase[];
}

export interface Testcase {
  name: string;
  status: "failed" | "succeeded" | "skipped";
  message?: string;
  time?: string;
  skipped: boolean;
}
export interface Testsuite {
  name: string;
  status: "failed" | "succeeded" | "skipped";
  timestamp?: string;
  testcases: Testcase[];
}

export async function loadJUnitXml(path: string): Promise<Testsuite[]> {
  const xml = readFileSync(path);
  const { testsuites } = await parseXml(xml);
  return (testsuites?.testsuite || []).map(
    ({
      $: { name, timestamp, failures, errors },
      testcase: testcases,
    }: JUnitTestsuite) => ({
      name,
      timestamp,
      status:
        Number.parseInt(failures) + Number.parseInt(errors) > 0
          ? "failed"
          : "succeeded",
      testcases: testcases.map(({ $: { name, time }, failure, skipped }) => ({
        name,
        time,
        status: failure ? "failed" : skipped ? "skipped" : "succeeded",
        message: failure,
      })),
    })
  );
}
