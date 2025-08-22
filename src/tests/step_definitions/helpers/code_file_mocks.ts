import { CodeFile } from "../../../core/codefile";

export class CodeFileMocks {
  static annotatedTypescriptController(className: string): CodeFile {
    return this.tsClassFile(className, 'controller', (codeFile, className) => {
      codeFile.write(`
        @Controller()
        export class ${className} {
          @Get()
          all() {
            return [];
          }
        }
      `);
    });
  }

  static typescriptControllerHelper(className: string): CodeFile {
    return this.tsClassFile(className, 'controller.helper', (codeFile, className) => {
      codeFile.write(`
        export class ${className} {
          simpleHelperMethod() {
            return undefined;
          }
        }
      `);
    });
  }

  static annotatedTypescriptService(className: string): CodeFile {
    return this.tsClassFile(className, 'service', (codeFile, className) => {
      codeFile.write(`
        @Service()
        export class ${className} {
          all() {
            return [];
          }
        }
      `);
    });
  }

  private static tsClassFile(
    className: string,
    category: string,
    handler: (codeFile: CodeFile, className: string) => void = () => {}
  ): CodeFile {
    const fileName: string = `${className.toLowerCase()}.${category}.ts`;
    const codeFile = new CodeFile(fileName);

    handler(codeFile, className);

    return codeFile;
  }
}