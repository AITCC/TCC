import { Folder } from "./folder";
import { LLMAgent } from "./llmagent";
import { CodeFile } from "./codefile";

export class Investigator {
  constructor(
    private agent: LLMAgent,
  ) { }

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

  async confirm(filePath: string, folder: Folder): Promise<boolean> {
    try {
      const codeFile = folder.getFile(filePath);
      return await this.agent.confirmCandidateContent(codeFile);
    } catch (error) {
      return false;
    }
  }

}