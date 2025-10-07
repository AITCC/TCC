import { LLMAgent } from "../core/llmagent";
import { GoogleGenAI } from "@google/genai";
import { CodeFile } from "../core/codefile";

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

  async confirmCandidateContent(codeFile: CodeFile): Promise<boolean> {
    const content = codeFile.read();
    const response = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: this.confirmationPrompt(codeFile.name, content)
    });
    const obj = JSON.parse(response.text || '{"isConfirmed": false}');
    return obj.isConfirmed;
  }

  async generateOpenApiDoc(codeFile: CodeFile): Promise<string> {
    const content = codeFile.read();

    const prompt = `
Analyze the following code and generate OpenAPI 3.0 documentation in YAML format.

Code:
\`\`\`
${content}
\`\`\`

Generate complete OpenAPI documentation following this structure:
- openapi version (3.0.0)
- info section (title, version, description)
- paths section with all endpoints
- For each endpoint: method, summary, description, responses
- Include schema definitions where appropriate

Return ONLY the YAML content, nothing else.
`;

    const response = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt
    });

    const yamlContent = response.text || '';

    return this.cleanYamlResponse(yamlContent);
  }

  private cleanYamlResponse(response: string): string {
    let cleaned = response.trim();

    if (cleaned.startsWith('```yaml')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }

    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    return cleaned.trim();
  }

  private candidatePrompt(filename: string): string {
    return `We are exploring the code of a software project, more specifically we're looking for REST API definitions. Based on the full file name (including the path to it), you need to tell me if the file is a good candidate for having such definitions. The current file name we're exploring is "${filename}".
    
    Your output MUST be formatted as a raw JSON object with a single attribute named "isCandidate". You MUST provide solely the raw JSON text and absolutely nothing else. Under no circumstances should the JSON be enclosed in Markdown code blocks or inline code quotes. This specific output format requirement strictly overrides any general instructions about using Markdown for formatting
    
    Example of a valid output: {"isCandidate": true}
    Example of an invalid output: \`\`\`json { "isCandidate": true } \`\`\`
    `;
  }

  private confirmationPrompt(filename: string, content: string): string {
    return `We are exploring the code of a software project, more specifically we're looking for REST API definitions. Based on the file content, confirm if this file contains REST API definitions. The file name is "${filename}" and its content is:

    ${content}
    
    Your output MUST be formatted as a raw JSON object with a single attribute named "isConfirmed". You MUST provide solely the raw JSON text and absolutely nothing else. Under no circumstances should the JSON be enclosed in Markdown code blocks or inline code quotes. This specific output format requirement strictly overrides any general instructions about using Markdown for formatting
    
    Example of a valid output: {"isConfirmed": true}
    Example of an invalid output: \`\`\`json { "isConfirmed": true } \`\`\`
    `;
  }
}