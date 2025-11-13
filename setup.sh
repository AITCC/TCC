#!/bin/bash

set -e

echo "================================================"
echo "TCC - Automated Setup Script"
echo "================================================"
echo ""

PROJECT_ROOT=$(pwd)

echo "[1/8] Creating directory structure..."
mkdir -p src/core
mkdir -p src/app
mkdir -p output
mkdir -p scripts

echo "[2/8] Creating FileSystemLoader..."
cat > src/core/filesystemloader.ts << 'EOF'
import * as fs from 'fs';
import * as path from 'path';
import { Folder } from './folder';
import { CodeFile } from './codefile';

export class FileSystemLoader {
  static loadDirectory(dirPath: string, rootName?: string): Folder {
    const absolutePath = path.resolve(dirPath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Directory not found: ${absolutePath}`);
    }

    const stats = fs.statSync(absolutePath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${absolutePath}`);
    }

    const folderName = rootName || path.basename(absolutePath);
    return this.loadDirectoryRecursive(absolutePath, folderName);
  }

  private static loadDirectoryRecursive(dirPath: string, folderName: string): Folder {
    const subfolders: Folder[] = [];
    const codefiles: CodeFile[] = [];

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        if (this.shouldIgnoreDirectory(item)) {
          continue;
        }
        
        const subfolder = this.loadDirectoryRecursive(itemPath, item);
        subfolders.push(subfolder);
      } else if (stats.isFile()) {
        if (this.shouldIgnoreFile(item)) {
          continue;
        }

        const codeFile = new CodeFile(item);
        const content = fs.readFileSync(itemPath, 'utf-8');
        codeFile.write(content);
        codefiles.push(codeFile);
      }
    }

    return new Folder(folderName, subfolders, codefiles);
  }

  private static shouldIgnoreDirectory(name: string): boolean {
    const ignoredDirs = [
      'node_modules',
      '.git',
      '.github',
      'dist',
      'build',
      'coverage',
      '.vscode',
      '.idea',
      'out',
      'bin',
      'obj',
      '__pycache__',
      '.pytest_cache',
      '.next',
      '.nuxt'
    ];
    return ignoredDirs.includes(name) || name.startsWith('.');
  }

  private static shouldIgnoreFile(name: string): boolean {
    const ignoredFiles = [
      '.DS_Store',
      'Thumbs.db',
      '.gitignore',
      '.dockerignore',
      '.env',
      '.env.local',
      '.env.production'
    ];
    
    const ignoredExtensions = [
      '.lock',
      '.log',
      '.map',
      '.min.js',
      '.min.css',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.svg',
      '.ico',
      '.woff',
      '.woff2',
      '.ttf',
      '.eot',
      '.pdf',
      '.zip',
      '.tar',
      '.gz'
    ];

    if (ignoredFiles.includes(name)) {
      return true;
    }

    return ignoredExtensions.some(ext => name.endsWith(ext));
  }

  static loadSpecificFiles(dirPath: string, fileNames: string[]): CodeFile[] {
    const absolutePath = path.resolve(dirPath);
    const codeFiles: CodeFile[] = [];

    for (const fileName of fileNames) {
      const filePath = path.join(absolutePath, fileName);
      
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const codeFile = new CodeFile(fileName);
        const content = fs.readFileSync(filePath, 'utf-8');
        codeFile.write(content);
        codeFiles.push(codeFile);
      }
    }

    return codeFiles;
  }
}
EOF

echo "[3/8] Creating OpenAPIGenerator..."
cat > src/app/openapigenerator.ts << 'EOF'
import { CodeFile } from '../core/codefile';
import { GeminiAgent } from './geminiagent';
import * as fs from 'fs';
import * as path from 'path';

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

export class OpenAPIGenerator {
  constructor(private agent: GeminiAgent) {}

  async generateSpecification(
    confirmedFiles: CodeFile[],
    projectInfo?: { 
      title?: string; 
      version?: string; 
      description?: string;
      serverUrl?: string;
    }
  ): Promise<OpenAPISpec> {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: {
        title: projectInfo?.title || 'Generated API',
        version: projectInfo?.version || '1.0.0',
        description: projectInfo?.description || 'API documentation generated automatically',
      },
      paths: {},
    };

    if (projectInfo?.serverUrl) {
      spec.servers = [{
        url: projectInfo.serverUrl,
        description: 'API Server'
      }];
    }

    console.log(`\n   Processing ${confirmedFiles.length} files...`);

    for (const file of confirmedFiles) {
      console.log(`   Processing: ${file.name}`);
      const paths = await this.extractPathsFromFile(file);
      
      Object.assign(spec.paths, paths);
      
      const endpointCount = Object.keys(paths).length;
      if (endpointCount > 0) {
        console.log(`      Found ${endpointCount} endpoint(s)`);
      } else {
        console.log(`      No endpoints extracted`);
      }
    }

    const totalEndpoints = Object.keys(spec.paths).length;
    console.log(`\n   Total endpoints in specification: ${totalEndpoints}`);

    return spec;
  }

  private async extractPathsFromFile(file: CodeFile): Promise<Record<string, any>> {
    const content = file.read();
    const endpoints = await this.agent.extractEndpoints(file.name, content);
    return endpoints;
  }

  static saveToFile(spec: OpenAPISpec, outputPath: string): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');
  }

  static saveToYAML(spec: OpenAPISpec, outputPath: string): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    try {
      const yaml = require('js-yaml');
      const yamlStr = yaml.dump(spec, {
        indent: 2,
        lineWidth: 120,
        noRefs: true
      });
      fs.writeFileSync(outputPath, yamlStr, 'utf-8');
    } catch (error) {
      console.warn('js-yaml not found, saving as JSON instead');
      const jsonPath = outputPath.replace(/\.ya?ml$/, '.json');
      fs.writeFileSync(jsonPath, JSON.stringify(spec, null, 2), 'utf-8');
    }
  }

  static validate(spec: OpenAPISpec): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!spec.openapi) {
      errors.push('Missing openapi version');
    }

    if (!spec.info || !spec.info.title || !spec.info.version) {
      errors.push('Missing required info fields (title, version)');
    }

    if (!spec.paths || Object.keys(spec.paths).length === 0) {
      errors.push('No paths defined');
    }

    for (const [pathName, pathItem] of Object.entries(spec.paths)) {
      if (!pathName.startsWith('/')) {
        errors.push(`Path "${pathName}" must start with /`);
      }

      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
      const hasMethod = methods.some(method => method in pathItem);
      
      if (!hasMethod) {
        errors.push(`Path "${pathName}" has no HTTP methods defined`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static generateSwaggerUI(specPath: string, outputPath: string): void {
    const specName = path.basename(specPath);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: './${specName}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
      });
    };
  </script>
</body>
</html>`;

    fs.writeFileSync(outputPath, html, 'utf-8');
  }
}
EOF

echo "[4/8] Creating TestGenerator..."
cat > src/app/testgenerator.ts << 'EOF'
import { OpenAPISpec } from './openapigenerator';
import { GeminiAgent } from './geminiagent';
import * as fs from 'fs';
import * as path from 'path';

export interface TestSuite {
  framework: 'jest' | 'mocha' | 'cucumber';
  language: 'typescript' | 'javascript';
  files: TestFile[];
}

export interface TestFile {
  filename: string;
  content: string;
  endpoint: string;
}

export class IntegrationTestGenerator {
  constructor(private agent: GeminiAgent) {}

  async generateTests(
    spec: OpenAPISpec,
    options: {
      framework?: 'jest' | 'mocha' | 'cucumber';
      language?: 'typescript' | 'javascript';
      baseUrl?: string;
    } = {}
  ): Promise<TestSuite> {
    const framework = options.framework || 'jest';
    const language = options.language || 'typescript';
    const baseUrl = options.baseUrl || 'http://localhost:3000';

    console.log(`\n   Generating ${framework} tests in ${language}...`);

    const testFiles: TestFile[] = [];

    for (const [pathName, pathItem] of Object.entries(spec.paths)) {
      console.log(`   Generating tests for: ${pathName}`);
      
      const testFile = await this.generateTestForEndpoint(
        pathName,
        pathItem,
        { framework, language, baseUrl }
      );
      
      if (testFile) {
        testFiles.push(testFile);
        console.log(`      Generated test file`);
      }
    }

    console.log(`\n   Total test files generated: ${testFiles.length}`);

    return {
      framework,
      language,
      files: testFiles
    };
  }

  private async generateTestForEndpoint(
    pathName: string,
    pathItem: any,
    options: {
      framework: string;
      language: string;
      baseUrl: string;
    }
  ): Promise<TestFile | null> {
    const methods = Object.keys(pathItem).filter(key => 
      ['get', 'post', 'put', 'delete', 'patch'].includes(key)
    );

    if (methods.length === 0) {
      return null;
    }

    const sanitizedPath = pathName
      .replace(/^\/api\//, '')
      .replace(/\//g, '-')
      .replace(/[{}:]/g, '');
    
    const extension = options.language === 'typescript' ? 'ts' : 'js';
    const filename = `${sanitizedPath}.test.${extension}`;

    const testContent = await this.generateTestContent(
      pathName,
      pathItem,
      methods,
      options
    );

    return {
      filename,
      content: testContent,
      endpoint: pathName
    };
  }

  private async generateTestContent(
    pathName: string,
    pathItem: any,
    methods: string[],
    options: {
      framework: string;
      language: string;
      baseUrl: string;
    }
  ): Promise<string> {
    const prompt = this.buildTestGenerationPrompt(
      pathName,
      pathItem,
      methods,
      options
    );

    try {
      const response = await this.agent['genAI'].models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt
      });

      return response.text || this.generateFallbackTest(pathName, methods, options);
    } catch (error) {
      console.error(`      Error generating test, using fallback`);
      return this.generateFallbackTest(pathName, methods, options);
    }
  }

  private buildTestGenerationPrompt(
    pathName: string,
    pathItem: any,
    methods: string[],
    options: any
  ): string {
    const pathItemJson = JSON.stringify(pathItem, null, 2);

    return `Generate integration tests for a REST API endpoint.

Framework: ${options.framework}
Language: ${options.language}
Base URL: ${options.baseUrl}
Endpoint: ${pathName}
Methods: ${methods.join(', ')}

OpenAPI Specification for this endpoint:
${pathItemJson}

Requirements:
1. Generate complete, runnable ${options.framework} tests
2. Use ${options.language} syntax
3. Test ALL HTTP methods defined: ${methods.join(', ')}
4. Include happy path tests and error cases
5. Use axios for HTTP requests
6. Follow ${options.framework} best practices

Return ONLY the test code, no explanations, no markdown code blocks.`;
  }

  private generateFallbackTest(
    pathName: string,
    methods: string[],
    options: any
  ): string {
    const imports = options.language === 'typescript'
      ? `import axios from 'axios';
import { describe, it, expect } from '@jest/globals';`
      : `const axios = require('axios');`;

    const tests = methods.map(method => {
      const methodUpper = method.toUpperCase();
      return `  it('should ${methodUpper} ${pathName}', async () => {
    const response = await axios.${method}('${options.baseUrl}${pathName}');
    expect(response.status).toBe(200);
  });`;
    }).join('\n\n');

    return `${imports}

const BASE_URL = '${options.baseUrl}';

describe('${pathName}', () => {
${tests}
});
`;
  }

  static saveTests(testSuite: TestSuite, outputDir: string): void {
    const testsDir = path.join(outputDir, 'tests', 'integration');
    
    if (!fs.existsSync(testsDir)) {
      fs.mkdirSync(testsDir, { recursive: true });
    }

    for (const testFile of testSuite.files) {
      const filePath = path.join(testsDir, testFile.filename);
      fs.writeFileSync(filePath, testFile.content, 'utf-8');
    }

    this.generateTestConfig(testSuite, outputDir);
  }

  private static generateTestConfig(testSuite: TestSuite, outputDir: string): void {
    if (testSuite.framework === 'jest') {
      const jestConfig = {
        preset: testSuite.language === 'typescript' ? 'ts-jest' : undefined,
        testEnvironment: 'node',
        testMatch: ['**/tests/integration/**/*.test.[jt]s'],
        collectCoverageFrom: ['src/**/*.[jt]s'],
        coverageDirectory: 'coverage'
      };

      const configPath = path.join(outputDir, 'jest.config.json');
      fs.writeFileSync(configPath, JSON.stringify(jestConfig, null, 2), 'utf-8');
    }
  }

  static generatePackageJson(testSuite: TestSuite, outputDir: string): void {
    const dependencies: Record<string, string> = {
      'axios': '^1.6.0'
    };

    const devDependencies: Record<string, string> = {};

    if (testSuite.framework === 'jest') {
      devDependencies['jest'] = '^29.7.0';
      devDependencies['@types/jest'] = '^29.5.0';
    }

    if (testSuite.language === 'typescript') {
      devDependencies['typescript'] = '^5.3.0';
      devDependencies['ts-jest'] = '^29.1.0';
      devDependencies['@types/node'] = '^20.0.0';
    }

    const packageJson = {
      name: 'generated-api-tests',
      version: '1.0.0',
      scripts: {
        test: testSuite.framework === 'jest' ? 'jest' : 'mocha',
        'test:watch': testSuite.framework === 'jest' ? 'jest --watch' : 'mocha --watch',
        'test:coverage': 'jest --coverage'
      },
      dependencies,
      devDependencies
    };

    const pkgPath = path.join(outputDir, 'tests-package.json');
    fs.writeFileSync(pkgPath, JSON.stringify(packageJson, null, 2), 'utf-8');
  }
}
EOF

echo "[5/8] Updating GeminiAgent..."
cat > src/app/geminiagent.ts << 'EOF'
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
      
      const result = JSON.parse(response.text || '{"paths": {}}');
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
EOF

echo "[6/8] Updating index.ts..."
cat > src/app/index.ts << 'EOF'
import { Investigator } from '../core/investigator';
import { FileSystemLoader } from '../core/filesystemloader';
import { OpenAPIGenerator } from './openapigenerator';
import { IntegrationTestGenerator } from './testgenerator';
import { Config } from './config';
import { GeminiAgent } from './geminiagent';
import * as path from 'path';

const main = async () => {
  try {
    console.log('Starting TCC - API Documentation Generator\n');

    const config: Config = Config.load();
    const geminiApiKey = config.requiredFromEnv("GEMINI_API_KEY");

    const geminiAgent = new GeminiAgent(geminiApiKey);
    const investigator = new Investigator(geminiAgent);
    const openAPIGenerator = new OpenAPIGenerator(geminiAgent);
    const testGenerator = new IntegrationTestGenerator(geminiAgent);

    const projectPath = process.argv[2] || './sample-project';
    
    console.log(`Loading project from: ${path.resolve(projectPath)}`);
    
    const rootFolder = FileSystemLoader.loadDirectory(projectPath);
    console.log(`Project loaded: ${rootFolder.name}`);
    console.log(`Total files found: ${rootFolder.listFiles().length}\n`);

    console.log('Phase 1: Investigating candidate files...');
    const candidates = await investigator.investigate(rootFolder);
    console.log(`Found ${candidates.length} candidate files:\n`);
    candidates.forEach(file => console.log(`   - ${file}`));
    console.log();

    console.log('Phase 2: Confirming candidates by content...');
    const confirmedFiles = [];
    
    for (const candidatePath of candidates) {
      const isConfirmed = await investigator.confirm(candidatePath, rootFolder);
      if (isConfirmed) {
        confirmedFiles.push(candidatePath);
        console.log(`   Confirmed: ${candidatePath}`);
      } else {
        console.log(`   Rejected: ${candidatePath}`);
      }
    }
    console.log(`\n${confirmedFiles.length} files confirmed\n`);

    if (confirmedFiles.length > 0) {
      console.log('Phase 3: Generating OpenAPI specification...');
      
      const confirmedCodeFiles = confirmedFiles.map(filePath => 
        rootFolder.getFile(filePath)
      );
      
      const openAPISpec = await openAPIGenerator.generateSpecification(
        confirmedCodeFiles,
        {
          title: `${rootFolder.name} API`,
          version: '1.0.0',
          description: `Auto-generated API documentation for ${rootFolder.name}`
        }
      );

      const outputPath = path.join('./output', `${rootFolder.name}-openapi.json`);
      OpenAPIGenerator.saveToFile(openAPISpec, outputPath);
      console.log(`OpenAPI specification saved to: ${outputPath}`);
      
      const swaggerPath = path.join('./output', 'swagger-ui.html');
      OpenAPIGenerator.generateSwaggerUI(outputPath, swaggerPath);
      console.log(`Swagger UI saved to: ${swaggerPath}\n`);

      console.log('Phase 4: Generating integration tests...');
      const testSuite = await testGenerator.generateTests(openAPISpec, {
        framework: 'jest',
        language: 'typescript',
        baseUrl: 'http://localhost:3000'
      });

      IntegrationTestGenerator.saveTests(testSuite, './output');
      IntegrationTestGenerator.generatePackageJson(testSuite, './output');
      console.log(`Integration tests saved to: ./output/tests/integration\n`);
    } else {
      console.log('No confirmed API files found. Skipping OpenAPI generation.\n');
    }

    console.log('Process completed successfully!');

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

export { main };
EOF

echo "[7/8] Creating .env.example..."
cat > .env.example << 'EOF'
GEMINI_API_KEY=your_gemini_api_key_here
EOF

echo "[8/8] Creating sample project..."
mkdir -p sample-project/routes

cat > sample-project/index.js << 'EOF'
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ]);
});

app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({ 
    id: userId, 
    name: 'John Doe', 
    email: 'john@example.com' 
  });
});

app.post('/api/users', (req, res) => {
  const newUser = {
    id: Date.now(),
    ...req.body
  };
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({
    id: userId,
    ...req.body
  });
});

app.delete('/api/users/:id', (req, res) => {
  res.json({ message: 'User deleted successfully' });
});

app.listen(port, () => {
  console.log(`API running at http://localhost:${port}`);
});
EOF

echo ""
echo "================================================"
echo "Setup completed successfully!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Configure your Gemini API key:"
echo "   cp .env.example .env"
echo "   nano .env  # Add your GEMINI_API_KEY"
echo ""
echo "2. Install dependencies (if not done yet):"
echo "   npm install"
echo ""
echo "3. Test the system:"
echo "   npm run dev ./sample-project"
echo ""
echo "4. View results:"
echo "   cat ./output/sample-project-openapi.json"
echo "   open ./output/swagger-ui.html"
echo ""
echo "================================================"
