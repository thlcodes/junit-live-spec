import { parseFeature } from '../gherkin';
import type { ParsedFeature } from '../gherkin';
import { SourceMediaType } from '@cucumber/messages';

describe('gherkin', () => {
  test('parse valid gherkin', async () => {
    const got = await parseFeature({
      data: VALID_GHERKIN,
      mediaType: SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN,
      uri: 'test'
    });
    expect(got).toEqual(WANT_FEATURE);
  });
});

const VALID_GHERKIN = `
@feature_tag
Feature: Complex
    In order to test this library
    As a developer
    I want to have a complex feature

    Background: Some Background
        Given this background

    @scenario_tag
    Scenario: Scenario one
        Given this scenario
        When a table
            |  B |  C |
            |  1 |  2 |
            | -1 | -2 |
        Then expect text
            """
            some text
            """

    Scenario Outline: Scenario outline <A>
        Given given <A>
        When when
        And and <A> <B>
        Then then <B>

        Examples:
            | A | B |
            | 1 | 2 |
            | 3 | 4 |
`;

const WANT_FEATURE: ParsedFeature = {
  title: 'Complex',
  tags: ['@feature_tag'],
  scenarios: [
    {
      title: 'Scenario one',
      tags: ['@feature_tag', '@scenario_tag'],
      steps: [
        {
          keyword: 'Given',
          text: 'this background'
        },
        {
          keyword: 'Given',
          text: 'this scenario'
        },
        {
          keyword: 'When',
          text: 'a table',
          table: {
            header: ['B', 'C'],
            rows: [
              ['1', '2'],
              ['-1', '-2']
            ]
          }
        },
        {
          keyword: 'Then',
          text: 'expect text',
          docstring: { content: 'some text' }
        }
      ]
    },
    {
      title: 'Scenario outline 1',
      tags: ['@feature_tag'],
      steps: [
        {
          keyword: 'Given',
          text: 'this background'
        },
        {
          keyword: 'Given',
          text: 'given 1'
        },
        {
          keyword: 'When',
          text: 'when'
        },
        {
          keyword: 'And',
          text: 'and 1 2'
        },
        {
          keyword: 'Then',
          text: 'then 2'
        }
      ]
    },
    {
      title: 'Scenario outline 3',
      tags: ['@feature_tag'],
      steps: [
        {
          keyword: 'Given',
          text: 'this background'
        },
        {
          keyword: 'Given',
          text: 'given 3'
        },
        {
          keyword: 'When',
          text: 'when'
        },
        {
          keyword: 'And',
          text: 'and 3 4'
        },
        {
          keyword: 'Then',
          text: 'then 4'
        }
      ]
    }
  ]
};
