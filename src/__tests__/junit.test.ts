import { parseJunitXml } from '../junit';
import { Testsuite } from '../junit';

describe('junit', () => {
  test('parse valid junit xml', async () => {
    const got = await parseJunitXml(VALID_JUNIT_XML);
    expect(got).toEqual(WANT_TESTSUITES);
  });
});

const VALID_JUNIT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="my testsuites">
  <testsuite name="empty testsuire" errors="0" failures="0" skipped="0" tests="0" timestamp="2022-03-01T08:00:00">
  </testsuite>
  <testsuite name="my first testsuite" errors="1" failures="1" skipped="1" tests="4" timestamp="2022-03-01T08:00:00">
    <testcase name="my ok testcase">
    </testcase>
    <testcase name="my skipped testcase">
      <skipped />
    </testcase>
    <testcase name="my failed testcase">
      <failure message="my failure message">my stack trace</failure>
    </testcase>
    <testcase name="my failed testcase w/o message">
      <failure>my stack trace</failure>
    </testcase>
    <testcase name="my errored testcase">
      <error message="my error message">my crash report</error>
    </testcase>
  </testsuite>
  <testsuite name="my second testsuite" tests="1" timestamp="2022-03-01T08:10:00">
    <testcase name="my other ok testcase">
    </testcase>
  </testsuite>
</testsuites>`;

const WANT_TESTSUITES: Testsuite[] = [
  {
    name: 'my first testsuite',
    status: 'failure',
    timestamp: '2022-03-01T08:00:00',
    testcases: [
      {
        name: 'my ok testcase',
        status: 'success'
      },
      {
        name: 'my skipped testcase',
        status: 'skipped'
      },
      {
        name: 'my failed testcase',
        status: 'failure',
        message: 'my failure message',
        details: 'my stack trace'
      },
      {
        name: 'my failed testcase w/o message',
        status: 'failure',
        details: 'my stack trace'
      },
      {
        name: 'my errored testcase',
        status: 'error',
        message: 'my error message',
        details: 'my crash report'
      }
    ]
  },
  {
    name: 'my second testsuite',
    status: 'success',
    timestamp: '2022-03-01T08:10:00',
    testcases: [
      {
        name: 'my other ok testcase',
        status: 'success'
      }
    ]
  }
];
