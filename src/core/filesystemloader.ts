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
