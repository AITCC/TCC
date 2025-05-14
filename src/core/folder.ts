import { CodeFile } from './codefile';

export class Folder {
  constructor(
    public name: string,
    public subfolders: Folder[] = [],
    public codefiles: CodeFile[] = [],
  ) {}

  listFiles(): string[] {
    const files: string[] = this.codefiles.map(file => this.name + '/' + file.name);
    for (const subfolder of this.subfolders) {
      const sub:string[] = subfolder
        .listFiles()
        .map(file => this.name + '/' + file);
      files.push(...sub);
    }
    return files;
  }
}
