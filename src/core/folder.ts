import { CodeFile } from './codefile';
import { CodeFileNotFoundError } from './errors/codefilenotfound';
import { FolderNotFoundError } from './errors/foldernotfound';

export class Folder {
  constructor(
    public name: string,
    public subfolders: Folder[] = [],
    public codefiles: CodeFile[] = [],
  ) { }

  listFiles(): string[] {
    const files: string[] = this.codefiles.map(file => this.name + '/' + file.name);
    for (const subfolder of this.subfolders) {
      const sub: string[] = subfolder
        .listFiles()
        .map(file => this.name + '/' + file);
      files.push(...sub);
    }
    return files;
  }

  addFolder(subfolder: Folder): void {
    this.subfolders.push(subfolder);
  }

  addFile(file: CodeFile): void {
    this.codefiles.push(file);
  }

  getFile(pathname: string): CodeFile {

    const parts = pathname.split('/');
    if (parts[0] !== this.name && parts[0] !== '.') {
      throw new FolderNotFoundError(`Folder not found: ${parts[0]}`);
    }
    if (parts.length === 2) {

      const codeFile = this.codefiles.find(file => file.name === parts[1]);
      if (!codeFile) {
        throw new CodeFileNotFoundError(`Code file not found: ${parts[1]}`);
      }
      return codeFile;

    }
    const subfolderName = parts[1];
    const subfolder = this.subfolders.find(folder => folder.name === subfolderName);
    if (!subfolder) {
      throw new FolderNotFoundError(`Subfolder not found: ${subfolderName}`);
    }
    parts.shift();
    const subPath = parts.join('/');
    return subfolder.getFile(subPath);
  }

  private prefixPath(name: string): string {
    return this.name + '/' + name;
  }
}
