import { CodeFile } from "../../core/codefile";
import { Folder } from "../../core/folder";
import { CodeFileNotFoundError } from "../../core/errors/codefilenotfound";
import { FolderNotFoundError } from "../../core/errors/foldernotfound";

describe(Folder, () => {
  let root: Folder;
  let configFile: CodeFile;
  let moduleFile: CodeFile;
  let classFile: CodeFile;

  beforeEach(() => {
    classFile = new CodeFile('user.ts');
    const core = new Folder("core");
    core.addFile(classFile);

    moduleFile = new CodeFile('main.ts');
    const main = new Folder("main");
    main.addFile(moduleFile);
    main.addFolder(core);

    configFile = new CodeFile('config.json');
    root = new Folder('project');
    root.addFile(configFile);
    root.addFolder(main);

    // root/
    //  +- config.json
    //  +- main/
    //  |   +- main.ts
    //  |   +- core/
    //  |   |   +- user.ts
  });

  describe('getFile(filePath: string): CodeFile', () => {
    it('should return a CodeFile directly in the Folder identifying the first path segment is the own folder', () => {
      const file = root.getFile('project/config.json');
      expect(file).toBe(configFile);
    });

    it('should return a CodeFile directly in the Folder identifying the dot notation', () => {
      const file = root.getFile('./config.json');
      expect(file).toBe(configFile);
    });

    it('should return a CodeFile in a subfolder of the Folder', () => {
      const fileInMain = root.getFile('project/main/main.ts');
      expect(fileInMain).toBe(moduleFile);

      const fileInCore = root.getFile('project/main/core/user.ts');
      expect(fileInCore).toBe(classFile);

    });

    it('should throw an error when the filePath has folders that do not exist in the Folder', () => {
      expect(() => root.getFile('project/nonExistingFolder/somefile.ts'))
        .toThrow(FolderNotFoundError);
      
      expect(() => root.getFile('project/main/nonExistingFolder/somefile.ts'))
        .toThrow(FolderNotFoundError);
    });

    it('should throw an error when the filePath points to a non existing file in existing subfolders in the Folder', () => {
      expect(() => root.getFile('project/nonExisting.json'))
        .toThrow(CodeFileNotFoundError);
      
      expect(() => root.getFile('project/main/nonExisting.ts'))
        .toThrow(CodeFileNotFoundError);
      
      expect(() => root.getFile('project/main/core/nonExisting.ts'))
        .toThrow(CodeFileNotFoundError);
    });
  });
});