import {CodeFile} from '../core/codefile';
import {Folder} from '../core/folder';
import { Investigator } from '../core/investigator';
import { GeminiAgent } from './geminiagent';

const main = async () => {
  const file1 = new CodeFile('file1.ts');
  const file2 = new CodeFile('file2.ts');
  const file3 = new CodeFile('restcontroller.ts');
  const subfolder1 = new Folder('subfolder1', [], [file1, file2]);
  const rootFolder = new Folder('root', [subfolder1], [file3]);

  const geminiAgent = new GeminiAgent();
  const investigator = new Investigator(geminiAgent);
  const candidates = await investigator.investigate(rootFolder);
  console.log('Candidate files:', candidates);
};

main();