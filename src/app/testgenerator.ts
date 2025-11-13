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
