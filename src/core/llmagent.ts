export interface LLMAgent {
  checkFileNameCandidate: (filename: string) => Promise<boolean>;
}