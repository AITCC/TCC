import { LLMAgent } from "../core/llmagent";

export class GeminiAgent implements LLMAgent {
  checkFileNameCandidate(filename: string): boolean {
    return false;
  }
  
}