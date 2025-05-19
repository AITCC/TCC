import { Folder } from "./folder";
import { LLMAgent } from "./llmagent";

export class Investigator {
  constructor(
    private agent: LLMAgent,
  ) {}

  async investigate(folder: Folder): Promise<string[]> {
    const candidates: string[] = [];
    const files = folder.listFiles();
    for (const file of files) {
      const isCandidate = await this.agent.checkFileNameCandidate(file);
      if (isCandidate) {
        candidates.push(file);
      }
    }  
    return candidates;
  } 
}