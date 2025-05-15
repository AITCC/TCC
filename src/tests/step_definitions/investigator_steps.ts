import { Given, When, Then, DataTable, setWorldConstructor, World } from '@cucumber/cucumber';
import { expect } from 'expect';
import { mock, instance, when, verify, anything, spy } from 'ts-mockito';

import { Investigator } from '../../core/investigator';
import { LLMAgent } from '../../core/llmagent';
import { Folder } from '../../core/folder';
import { CodeFile } from '../../core/codefile';

class InvestigatorWorld extends World {
  projectFolders: Map<string, Folder> = new Map();
  mockAgent!: LLMAgent;
  agentInstance!: LLMAgent;
  investigator!: Investigator;
  actualCandidates?: string[];
  allProcessedFiles: string[] = [];

  constructor(options: any) {
    super(options);
  }

  createMvcProjectFolder(name: string): Folder {
    const folder = new Folder("mvcProject",
      [
        new Folder("src",
          [
            new Folder("controllers", [], [
              new CodeFile("rest.user.ts"),
              new CodeFile("rest.post.ts")
            ]),
            new Folder("models", [], [
              new CodeFile("user.ts"),
              new CodeFile("post.ts")
            ]),
            new Folder("views", [], [
              new CodeFile("profile.user.tsx"),
              new CodeFile("register.user.tsx"),
              new CodeFile("timeline.post.tsx"),
              new CodeFile("card.post.tsx")
            ]),
          ],
          [new CodeFile("main.ts")]
        ),
        new Folder("tests",
          [
            new Folder("unit", [
              new Folder("model", [], [
                new CodeFile("user.test.ts"),
                new CodeFile("post.test.ts"),
              ]),
            ], []),
            new Folder("e2e", [
              new Folder("api", [], [
                new CodeFile("rest.user.test.ts"),
                new CodeFile("rest.post.test.ts"),
              ]),
              new Folder("ui", [], [
                new CodeFile("profile.user.test.ts"),
                new CodeFile("register.user.test.ts"),
                new CodeFile("timeline.post.test.ts"),
                new CodeFile("card.post.test.ts")
              ]),
            ], [])
          ],
          []
        ),
        new Folder("docs", [], [new CodeFile("readme.md")])
      ],
      [
        new CodeFile("package-lock.json"),
        new CodeFile("package.json")
      ]
    );
    this.projectFolders.set(name, folder);
    this.allProcessedFiles = folder.listFiles();
    return folder;
  }
}

setWorldConstructor(InvestigatorWorld);

Given('a project folder structure defined as {string}', function (this: InvestigatorWorld, folderName: string) {
  if (folderName === "mvcProject") {
    this.createMvcProjectFolder(folderName);
  } else {
    throw new Error(`Undefined project folder structure: ${folderName}`);
  }
});

Given('an LLM agent configured to identify {string} files without {string}', function (this: InvestigatorWorld, keywords: string, excluded: string) {
  this.mockAgent = mock<LLMAgent>();
  when(this.mockAgent.checkFileNameCandidate(anything())).thenCall((filename: string) => {
    const kws = keywords.split(",").map(kw => kw.trim());
    const xkws = excluded.split(",").map(xkw => xkw.trim());

    const hasKeyword = kws.some(kw => filename.includes(kw));
    const hasExcludedKeyword = xkws.some(xkw => filename.includes(xkw));

    return hasKeyword && !hasExcludedKeyword;
  });
  this.agentInstance = instance(this.mockAgent);
  this.investigator = new Investigator(this.agentInstance);
});

When('the investigator processes the {string} root folder', function (this: InvestigatorWorld, folderName: string) {
  const folderToProcess = this.projectFolders.get(folderName);
  if (!folderToProcess) {
    throw new Error(`Folder ${folderName} not found in context.`);
  }
  if (!this.investigator) {
    throw new Error('Investigator not initialized. Ensure agent is configured first.');
  }
  this.actualCandidates = this.investigator.investigate(folderToProcess);
});

Then('the identified candidate files should be:', function (this: InvestigatorWorld, dataTable: DataTable) {
  const expectedCandidates = dataTable.rows().map(row => row[0]).sort();
  expect(this.actualCandidates?.sort()).toEqual(expectedCandidates);
});

Then('the LLM agent\'s "checkFileNameCandidate" method should have been called for all files in the {string}', function (this: InvestigatorWorld, folderName: string) {
  if (!this.mockAgent) {
    throw new Error('Mock agent not initialized.');
  }
  if (this.allProcessedFiles.length === 0 && folderName === "complexProject") {
      const folder = this.projectFolders.get(folderName);
      this.allProcessedFiles = folder ? folder.listFiles() : [];
  }

  this.allProcessedFiles.forEach(filePath => {
    verify(this.mockAgent.checkFileNameCandidate(filePath)).atLeast(1);
  });
});