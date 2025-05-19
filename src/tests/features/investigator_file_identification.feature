Feature: Investigator File Identification
  As a user of the Investigator tool
  I want it to correctly identify candidate files based on agent rules
  So that I can process only relevant files in a project structure

  Scenario: Identify only TypeScript files in a complex project structure
    Given a project folder structure defined as "mvcProject"
    And an LLM agent configured to identify "api,rest,controller" files without "test"
    When the investigator processes the "mvcProject" root folder
    Then the identified candidate files should be:
      | filePath                                |
      | mvcProject/src/controllers/rest.user.ts |
      | mvcProject/src/controllers/rest.post.ts |
    And the LLM agent's "checkFileNameCandidate" method should have been called for all files in the "mvcProject"
