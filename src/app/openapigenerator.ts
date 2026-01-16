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
