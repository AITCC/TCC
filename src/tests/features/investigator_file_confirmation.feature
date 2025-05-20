Feature:
    As a user of the Investigator tool
    I want it to confirm candidates based on their file contents
    So that I can automatically generate the API specification

  Scenario: Confirm controller candidates in a "annotated" application
    Given a list of candidates of "annotated" application including "a controller and two services"
    And a mock LLM agent configured to look for "@Controller" in a class
    When the investigator is asked to confirm the candidates of the application
    Then the confirmed files should be:
      | filePath                                     |
      | annotated/src/controllers/user.controller.ts |
