import { Folder } from "./folder";
import { LLMAgent } from "./llmagent";
import { CodeFile } from "./codefile";

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
  
  async confirm(filePath: string, folder: Folder): Promise<boolean> {
    const codeFile = this.findFileInFolder(filePath, folder);
    
    if (!codeFile) {
      return false;
    }
    
    return await this.agent.confirmCandidateContent(codeFile);
  }
  
  private findFileInFolder(filePath: string, folder: Folder): CodeFile | null {
    if (!filePath.startsWith(folder.name + '/')) {
      return null;
    }
    
    const relativePath = filePath.substring(folder.name.length + 1);
    
    if (!relativePath.includes('/')) {
      return folder.codefiles.find(file => file.name === relativePath) || null;
    }
    
    const firstSlash = relativePath.indexOf('/');
    const subfolderName = relativePath.substring(0, firstSlash);
    const remainingPath = relativePath.substring(firstSlash + 1);
    
    const subfolder = folder.subfolders.find(sf => sf.name === subfolderName);
    if (!subfolder) {
      return null;
    }
    
    return this.findFileInFolder(subfolderName + '/' + remainingPath, subfolder);
  }
}