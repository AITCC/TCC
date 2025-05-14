export interface LLMAgent {
  checkFileNameCandidate: (filename: string) => boolean;
}