import {CodeFile} from '../core/codefile';
import {Folder} from '../core/folder';

const file1 = new CodeFile('file1.ts');
const file2 = new CodeFile('file2.ts');
const file3 = new CodeFile('file3.ts');
const subfolder1 = new Folder('subfolder1', [], [file1, file2]);
const rootFolder = new Folder('root', [subfolder1], [file3]);

console.log(rootFolder.listFiles()); 