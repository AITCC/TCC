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
