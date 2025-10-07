import { CodeFile } from "./codefile";

export interface LLMAgent {
  checkFileNameCandidate: (filename: string) => Promise<boolean>;
  confirmCandidateContent: (codeFile: CodeFile) => Promise<boolean>;
  generateOpenApiDoc(codeFile: CodeFile): Promise<string>;
}