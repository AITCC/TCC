import { Folder } from "./folder";
import { LLMAgent } from "./llmagent";
import { CodeFile } from "./codefile";
import { FolderLoader } from "./folderloader";


export class Investigator {
  constructor(
    private agent: LLMAgent,
    private folderLoader: FolderLoader | undefined = undefined
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

  async generateOas(codeFile: CodeFile): Promise<string> {

    const oasYaml = await this.agent.generateOpenApiDoc(codeFile);

    return oasYaml;
  }

  async execute(folderPath: string): Promise<void> {
    const folder = this.folderLoader
      ? this.folderLoader.loadFolder(folderPath)
      : new Folder('.'); // Temporary code until FolderLoader is implemented
    const candidates = await this.investigate(folder);

    for (const candidate of candidates) {
      const isConfirmed = await this.confirm(candidate, folder);
      if (isConfirmed) {
        const codeFile = folder.getFile(candidate);
        const oas = await this.generateOas(codeFile);
        console.log(`Generated OpenAPI documentation for ${candidate}:\n${oas}`);
      }
    }
  }
}
