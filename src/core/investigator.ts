import { Folder } from "./folder";
import { LLMAgent } from "./llmagent";

export class Investigator {
  constructor(
    private agent: LLMAgent,
  ) {}

  investigate(folder: Folder): string[] {
    return folder.listFiles().filter((filename) => this.agent.checkFileNameCandidate(filename));
  } 
}