Feature: OpenAPI Specification Generator
  As a user of the tool (who is a developer)
  I want it to generate the OpenAPI Specifications for the files containing API defintions
  So that I don't have to manually generate them

  Scenario: Generate OpenAPI Specification for the "simplest" application
    Given a list of confirmed files from the "simplest" application
    And a mock LLM agent configured to always generate a "hello world" OAS
    When the investigator is asked to generate the OAS for the confirmed files of the "simplest" application
    Then the investigator returns the "hello world" OAS object

  Scenario: Generate OpenAPI Specification for the "more complex" application
    Given a list of confirmed files from the "more complex" application
    And a mock LLM agent configured to always generate a "hello universe" OAS
    When the investigator is asked to generate the OAS for the confirmed files of the "more complex" application
    Then the investigator returns the "hello universe" OAS object

  Scenario: Attempt to generate OpenAPI Specification when confirmation is faulty
    Given a list of confirmed files from the "faulty" application
    And a mock LLM agent configured to throw an error when generating the OAS for a file with "faulty" in the name
    When the investigator is asked to generate the OAS for the confirmed files of the "faulty" application
    Then the investigator generates the OAS for the non-faulty files
    And the investigator ignores the file that caused the error
