import { LLMAgent } from "../core/llmagent";
import { GoogleGenAI } from "@google/genai";


export class GeminiAgent implements LLMAgent {
  private genAI: GoogleGenAI;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey: apiKey })
  }

  async checkFileNameCandidate(filename: string): Promise<boolean> {
    const response = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: this.candidatePrompt(filename)
    });
    const obj = JSON.parse(response.text || '{"isCandidate": false}');
    return obj.isCandidate;
  }

  private candidatePrompt(filename: string): string {
    return `We are exploring the code of a software project, more specifically we're looking for REST API definitions. Based on the full file name (including the path to it), you need to tell me if the file is a good candidate for having such definitions. The current file name we're exploring is "${filename}".
    
    Your output MUST be formatted as a raw JSON object with a single attribute named "isCandidate". You MUST provide solely the raw JSON text and absolutely nothing else. Under no circumstances should the JSON be enclosed in Markdown code blocks or inline code quotes. This specific output format requirement strictly overrides any general instructions about using Markdown for formatting
    
    Example of a valid output: {"isCandidate": true}
    Example of an invalid output: \`\`\`json { "isCandidate": true } \`\`\`
    `;
  }


  
}