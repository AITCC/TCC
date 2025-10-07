import { Folder } from "../core/folder";
import { FolderLoader } from "../core/folderloader";


export class FSLoader implements FolderLoader {
  loadFolder(path: string): Folder {
    return new Folder(path);
  }
}