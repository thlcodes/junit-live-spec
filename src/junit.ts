import { readFileSync } from 'fs';
import { parseStringPromise as parseXml } from 'xml2js';

type XmlNode = { _: string; $?: { message: string } };
type ErrorOrFailure = string | XmlNode;

// internal representation of a junit test case
interface JUnitTestcase {
  $: { name: string; time: string };
  failure: ErrorOrFailure[];
  skipped: unknown;
  error: ErrorOrFailure[];
}

// internal representation of a junit test suite
interface JUnitTestsuite {
  $: { name: string; timestamp: string; failures: string; errors: string };
  testcase: JUnitTestcase[];
}

export type Teststatus = 'success' | 'skipped' | 'failure' | 'error';

// testcase model reduced to the required minimum
export interface Testcase {
  name: string;
  status: Teststatus;
  message?: string;
  details?: string;
}

// testsuite model reduced to the required minimum
export interface Testsuite {
  name: string;
  status: Teststatus;
  timestamp?: string;
  testcases: Testcase[];
}

// get message from testcase
function testcaseMessage(from: ErrorOrFailure): string | undefined {
  if (!from) return undefined;
  if (typeof from == 'string') return undefined;
  return (from as XmlNode).$?.message || undefined;
}

// get details (e.g. stack trace, crash report) from testcase
function testcaseDetails(from: ErrorOrFailure): string | undefined {
  if (!from) return undefined;
  if (typeof from == 'string') return from;
  return (from as XmlNode)._;
}

// parses XML data into a list of testsuites
export async function parseJunitXml(xml: string): Promise<Testsuite[]> {
  const { testsuites } = await parseXml(xml);
  return (testsuites?.testsuite || []).map(
    ({ $: { name, timestamp, failures, errors }, testcase: testcases }: JUnitTestsuite) => ({
      name,
      timestamp,
      status: Number.parseInt(failures) + Number.parseInt(errors) > 0 ? 'failure' : 'success',
      testcases: testcases.map(({ $: { name }, failure, error, skipped }) => ({
        name,
        status: failure ? 'failure' : error ? 'error' : skipped ? 'skipped' : 'success',
        message: testcaseMessage((error || [])[0] || (failure || [])[0]),
        details: testcaseDetails((error || [])[0] || (failure || [])[0])
      }))
    })
  );
}

// loads a XML file and parses its contents into a list of testsuites
export async function loadJUnitXml(path: string): Promise<Testsuite[]> {
  const xml = readFileSync(path);
  return await parseJunitXml(xml.toString());
}
