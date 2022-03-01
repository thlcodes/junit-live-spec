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

    @skipped
    Scenario: Skipped Scenario two
        Given no steps

    Scenario Outline: Scenario outline <A>
        Given given <A>
        When when
        And and <A> <B>
        Then then <B>

        Examples:
            | A | B |
            | 1 | 2 |
            | 3 | 4 |