Feature: Complex
    In order to test this library
    As a developer
    I want to have a complex feature

    Background: Some Background
        Given this
        Then that

    Scenario: Scenario one
        Given this scenarion
        When when
            | B | C |
            | 1 | 2 |
        Then all is well
            """
            some text
            """

    Scenario Outline: Scenario outline <A>
        Given given <A>
        When when
        Then then <B>

        Examples:
            | A | B |
            | 1 | 2 |
            | 3 | 4 |

