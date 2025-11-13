import { LLMAgent } from "../core/llmagent";
import { GoogleGenAI } from "@google/genai";
import { CodeFile } from "../core/codefile";

export class GeminiAgent implements LLMAgent {
  private genAI: GoogleGenAI;
  
  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey: apiKey })
  }

  async checkFileNameCandidate(filename: string): Promise<boolean> {
    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: this.candidatePrompt(filename)
      });
      const obj = JSON.parse(response.text || '{"isCandidate": false}');
      return obj.isCandidate;
    } catch (error) {
      console.error(`Error checking candidate ${filename}:`, error);
      return false;
    }
  }
  
  async confirmCandidateContent(codeFile: CodeFile): Promise<boolean> {
    try {
      const content = codeFile.read();
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: this.confirmationPrompt(codeFile.name, content)
      });
      const obj = JSON.parse(response.text || '{"isConfirmed": false}');
      return obj.isConfirmed;
    } catch (error) {
      console.error(`Error confirming ${codeFile.name}:`, error);
      return false;
    }
  }

async extractEndpoints(fileName: string, content: string): Promise<Record<string, any>> {
  try {
    const response = await this.genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: this.endpointExtractionPrompt(fileName, content)
    });
    
    let text = response.text || '{"paths": {}}';
    
    // Remove markdown code blocks if present
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const result = JSON.parse(text);
    return result.paths || {};
  } catch (error) {
    console.error(`Error extracting endpoints from ${fileName}:`, error);
    return {};
  }
}

  private candidatePrompt(filename: string): string {
    return `We are exploring the code of a software project, more specifically we're looking for REST API definitions. Based on the full file name (including the path to it), you need to tell me if the file is a good candidate for having such definitions. The current file name we're exploring is "${filename}".
    
    Consider these patterns as STRONG indicators:
    - Files with "controller", "api", "rest", "route", "endpoint" in the name
    - Files in folders named "controllers", "api", "routes", "handlers"
    - Common frameworks: Express.js routes, NestJS controllers, FastAPI routes, etc.
    
    Consider these as NOT candidates:
    - Test files (*.test.*, *.spec.*)
    - Configuration files
    - Model/Entity files (unless they have decorators for API endpoints)
    - Helper/Utility files
    
    Your output MUST be formatted as a raw JSON object with a single attribute named "isCandidate". You MUST provide solely the raw JSON text and absolutely nothing else. Under no circumstances should the JSON be enclosed in Markdown code blocks or inline code quotes. This specific output format requirement strictly overrides any general instructions about using Markdown for formatting
    
    Example of a valid output: {"isCandidate": true}
    Example of an invalid output: \`\`\`json { "isCandidate": true } \`\`\`
    `;
  }
  
  private confirmationPrompt(fileName: string, content: string): string {
    return `We are exploring the code of a software project, more specifically we're looking for REST API definitions. Based on the file content, confirm if this file contains REST API definitions. The file name is "${fileName}" and its content is:

${content}

Look for these patterns:
- HTTP method decorators: @Get(), @Post(), @Put(), @Delete(), @Patch()
- Express.js routes: app.get(), router.post(), etc.
- FastAPI routes: @app.get(), @router.post(), etc.
- NestJS controllers with decorators
- Spring Boot @RestController, @GetMapping, etc.
- Any clear REST endpoint definitions

If the file contains ANY of these patterns, it's confirmed.

Your output MUST be formatted as a raw JSON object with a single attribute named "isConfirmed". You MUST provide solely the raw JSON text and absolutely nothing else. Under no circumstances should the JSON be enclosed in Markdown code blocks or inline code quotes. This specific output format requirement strictly overrides any general instructions about using Markdown for formatting

Example of a valid output: {"isConfirmed": true}
Example of an invalid output: \`\`\`json { "isConfirmed": true } \`\`\`
`;
  }

  private endpointExtractionPrompt(fileName: string, content: string): string {
    return `Extract ALL REST API endpoints from this file and format them as OpenAPI 3.0 paths.

File: ${fileName}
Content:
${content}

For each endpoint found, extract:
1. HTTP method (GET, POST, PUT, DELETE, PATCH, etc.)
2. Path/route (e.g., /api/users, /users/:id)
3. Summary/description
4. Parameters (path, query, body)
5. Response codes and descriptions

Your output MUST be a raw JSON object with this structure:
{
  "paths": {
    "/endpoint/path": {
      "get": {
        "summary": "Description",
        "parameters": [...],
        "responses": {
          "200": {
            "description": "Success"
          }
        }
      }
    }
  }
}

CRITICAL RULES:
- Return ONLY the raw JSON, no markdown, no code blocks, no explanations
- If no endpoints found, return {"paths": {}}
- Use proper OpenAPI 3.0 format
- Convert :param or {param} to OpenAPI parameter objects
- Infer response types from code when possible

Example valid output:
{"paths": {"/users": {"get": {"summary": "Get all users", "responses": {"200": {"description": "List of users"}}}}}}
`;
  }
}
